import 'server-only'
import type Stripe from 'stripe'
import {createServiceClient} from '@/utility/supabase/service'
import {packageRank} from './packages'

// Unlock the paid package + log the payment for a completed Checkout session.
// Called from BOTH the success page (synchronous, so the buyer sees it unlocked
// immediately) and the webhook (the backup for buyers who never return). Safe to
// run more than once: the package update never downgrades, and the unique
// `stripe_session_id` makes the payment insert a no-op on replay.
//
// Returns true only when the event now holds (at least) the paid package, so the
// caller never reports a phantom success when the write didn't actually land.
export async function fulfillCheckoutSession(session: Stripe.Checkout.Session): Promise<boolean> {
  if (session.payment_status !== 'paid') return false

  const meta = session.metadata ?? {}
  const eventId = meta.event_id
  const userId = meta.user_id
  const target = meta.target_package
  const previous = meta.previous_package ?? null
  if (!eventId || !userId || !target) {
    console.error('[stripe/fulfill] session missing metadata', {sessionId: session.id, meta})
    return false
  }

  const supabase = createServiceClient()

  // Read the current package. If the event isn't in this database, fulfilment
  // can't succeed — surface it loudly instead of faking success.
  const {data: current, error: readError} = await supabase
    .from('events')
    .select('package')
    .eq('id', eventId)
    .maybeSingle()
  if (readError) {
    console.error('[stripe/fulfill] failed to read event', {eventId, error: readError})
    return false
  }
  if (!current) {
    console.error('[stripe/fulfill] event not found in this database', {eventId})
    return false
  }

  // 1. Lift the event onto the paid package — never downgrade.
  if (packageRank(target) > packageRank(current.package as string)) {
    const {error: updateError} = await supabase
      .from('events')
      .update({package: target})
      .eq('id', eventId)
    if (updateError) {
      console.error('[stripe/fulfill] failed to update package', {eventId, target, error: updateError})
      return false
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

  return true
}
