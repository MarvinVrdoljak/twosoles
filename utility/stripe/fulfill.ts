import 'server-only'
import type Stripe from 'stripe'
import {createServiceClient} from '@/utility/supabase/service'
import {trackEventServer} from '@/utility/analytics/track.server'
import type {PackageKey} from '@/utility/analytics/events'
import {packageRank} from './packages'

// Outcome of a fulfilment attempt. The webhook uses this to decide its HTTP
// status: `transient` → 500 so Stripe retries; everything else → 200 (nothing to
// gain from a retry). `skipped` = the session isn't paid (yet); `permanent` =
// the session can never be fulfilled here (bad metadata / unknown event).
export type FulfillResult = 'ok' | 'skipped' | 'permanent' | 'transient'

// Unlock the paid package + log the payment for a completed Checkout session.
// Called from BOTH the success page (synchronous, so the buyer sees it unlocked
// immediately) and the webhook (the backup for buyers who never return). Safe to
// run more than once: the package update never downgrades, and the unique
// `stripe_session_id` makes the payment insert a no-op on replay.
//
// Returns `ok` only when the event now holds (at least) the paid package, so the
// caller never reports a phantom success when the write didn't actually land.
export async function fulfillCheckoutSession(
  session: Stripe.Checkout.Session,
): Promise<FulfillResult> {
  // Not paid yet (e.g. a `completed` event for a delayed payment method); the
  // matching `async_payment_succeeded` event will fulfil it later.
  if (session.payment_status !== 'paid') return 'skipped'

  const meta = session.metadata ?? {}
  const eventId = meta.event_id
  const userId = meta.user_id
  const target = meta.target_package
  const previous = meta.previous_package ?? null
  if (!eventId || !userId || !target) {
    console.error('[stripe/fulfill] session missing metadata', {sessionId: session.id, meta})
    return 'permanent'
  }

  const supabase = createServiceClient()

  // Read the current package. A DB error is transient (retry); a genuinely
  // missing event is permanent (this database will never have it).
  const {data: current, error: readError} = await supabase
    .from('events')
    .select('package')
    .eq('id', eventId)
    .maybeSingle()
  if (readError) {
    console.error('[stripe/fulfill] failed to read event', {eventId, error: readError})
    return 'transient'
  }
  if (!current) {
    console.error('[stripe/fulfill] event not found in this database', {eventId})
    return 'permanent'
  }

  // 1. Lift the event onto the paid package — never downgrade.
  if (packageRank(target) > packageRank(current.package as string)) {
    const {error: updateError} = await supabase
      .from('events')
      .update({package: target})
      .eq('id', eventId)
    if (updateError) {
      console.error('[stripe/fulfill] failed to update package', {eventId, target, error: updateError})
      return 'transient'
    }
  }

  // 2. Record the payment for the billing history (best-effort; a unique-
  // violation just means it was already logged by the other fulfilment path).
  const {error: insertError} = await supabase.from('event_payments').insert({
    event_id: eventId,
    user_id: userId,
    stripe_session_id: session.id,
    stripe_payment_intent:
      typeof session.payment_intent === 'string' ? session.payment_intent : null,
    target_package: target,
    previous_package: previous,
    amount_total: session.amount_total,
    currency: session.currency,
  })
  if (insertError && insertError.code !== '23505') {
    console.error('[stripe/fulfill] payment log insert failed', {eventId, error: insertError})
  }

  // Track the paid conversion exactly once. A `null` insertError means this call
  // just logged a brand-new payment; a `23505` means the other fulfilment path
  // (webhook vs. success page) already logged — and already tracked — it.
  if (!insertError) {
    await trackEventServer('checkout_paid', {package: target as PackageKey})
  }

  return 'ok'
}
