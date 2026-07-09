import 'server-only'
import type Stripe from 'stripe'
import {createServiceClient} from '@/utility/supabase/service'
import {packageRank} from './packages'

// Unlock the paid package + log the payment for a completed Checkout session.
// Called from BOTH the success page (synchronous, so the buyer sees it unlocked
// immediately) and the webhook (the backup for buyers who never return). Safe to
// run more than once: the package update never downgrades, and the unique
// `stripe_session_id` makes the payment insert a no-op on replay.
export async function fulfillCheckoutSession(session: Stripe.Checkout.Session): Promise<void> {
  if (session.payment_status !== 'paid') return

  const meta = session.metadata ?? {}
  const eventId = meta.event_id
  const userId = meta.user_id
  const target = meta.target_package
  const previous = meta.previous_package ?? null
  if (!eventId || !userId || !target) return

  const supabase = createServiceClient()

  // 1. Lift the event onto the paid package — never downgrade.
  const {data: current} = await supabase
    .from('events')
    .select('package')
    .eq('id', eventId)
    .maybeSingle()
  if (current && packageRank(target) > packageRank(current.package as string)) {
    await supabase.from('events').update({package: target}).eq('id', eventId)
  }

  // 2. Record the payment for the billing history.
  const {error} = await supabase.from('event_payments').insert({
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
  if (error && error.code !== '23505') {
    console.error('event_payments insert failed', error)
  }
}
