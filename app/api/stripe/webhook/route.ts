import {NextResponse} from 'next/server'
import type Stripe from 'stripe'
import {getStripe} from '@/utility/stripe/server'
import {fulfillCheckoutSession} from '@/utility/stripe/fulfill'

// Stripe needs Node crypto + the raw request body, so keep this off the edge and
// never cache it.
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Payment fulfilment for Managed Payments Checkout — the backup path for buyers
// who close the tab instead of returning to the success page (which fulfils
// synchronously). Stripe is the merchant of record, so the browser never
// confirms a purchase; this and the success page are the only things that lift
// an event onto the package it paid for.
export async function POST(req: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET
  if (!secret) {
    return NextResponse.json({error: 'not configured'}, {status: 500})
  }

  const signature = req.headers.get('stripe-signature')
  if (!signature) {
    return NextResponse.json({error: 'missing signature'}, {status: 400})
  }

  const payload = await req.text()

  let event: Stripe.Event
  try {
    event = await getStripe().webhooks.constructEventAsync(payload, signature, secret)
  } catch {
    return NextResponse.json({error: 'invalid signature'}, {status: 400})
  }

  // `completed` covers instant (card-like) payments; `async_payment_succeeded`
  // is the follow-up for delayed methods whose `completed` arrived unpaid.
  if (
    event.type === 'checkout.session.completed' ||
    event.type === 'checkout.session.async_payment_succeeded'
  ) {
    const result = await fulfillCheckoutSession(event.data.object as Stripe.Checkout.Session)
    // A transient failure (DB unreachable, etc.) must NOT be acked with 2xx, or
    // Stripe drops it — and this webhook is the only safety net for buyers who
    // never return to the success page. Returning 500 makes Stripe retry.
    if (result === 'transient') {
      console.error('[stripe/webhook] transient fulfilment failure, asking Stripe to retry', {
        eventId: event.id,
      })
      return NextResponse.json({error: 'retry'}, {status: 500})
    }
    if (result === 'permanent') {
      // Retrying can't help (bad metadata / unknown event); ack so Stripe stops.
      console.error('[stripe/webhook] permanent fulfilment failure, not retrying', {
        eventId: event.id,
      })
    }
  }

  return NextResponse.json({received: true})
}
