'use server'

import {headers} from 'next/headers'
import {createClient} from '@/utility/supabase/server'
import {getUser} from '@/utility/supabase/user'
import {getStripe} from './server'
import {fulfillCheckoutSession} from './fulfill'
import {
  CURRENCY,
  isPaidPackage,
  productIdFor,
  upgradeAmountCents,
  type PaidPackage,
} from './packages'

type CheckoutResult = {url: string} | {error: 'auth' | 'notfound' | 'invalid' | 'stripe'}

type ConfirmResult = {ok: true; package: PaidPackage} | {ok: false}

// Absolute origin for Stripe's redirect URLs. Prefer the incoming request host
// (works across localhost:3001, previews and prod); fall back to an env override.
async function origin(): Promise<string> {
  const h = await headers()
  const host = h.get('x-forwarded-host') ?? h.get('host')
  if (host) {
    const proto = h.get('x-forwarded-proto') ?? (host.startsWith('localhost') ? 'http' : 'https')
    return `${proto}://${host}`
  }
  return process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3001'
}

// Create a Managed Payments Checkout session that upgrades `eventId` to
// `targetPackage`. Used both by the creation wizard (fresh purchase, current
// package = free) and the event-detail upgrade (pay the difference). The event
// stays on its current (free) package until the webhook confirms payment.
export async function createCheckoutSessionAction(
  eventId: string,
  targetPackage: string,
): Promise<CheckoutResult> {
  const user = await getUser()
  if (!user) return {error: 'auth'}

  if (!isPaidPackage(targetPackage)) return {error: 'invalid'}
  const target: PaidPackage = targetPackage

  // RLS scopes this to the owner, so a foreign event id just comes back empty.
  const supabase = await createClient()
  const {data: event} = await supabase
    .from('events')
    .select('id, package')
    .eq('id', eventId)
    .maybeSingle()
  if (!event) return {error: 'notfound'}

  const current = event.package as string
  const amount = upgradeAmountCents(current, target)
  if (amount === null) return {error: 'invalid'}

  const base = await origin()

  try {
    const session = await getStripe().checkout.sessions.create({
      mode: 'payment',
      managed_payments: {enabled: true},
      client_reference_id: eventId,
      customer_email: user.email ?? undefined,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: CURRENCY,
            product: productIdFor(target),
            unit_amount: amount,
            // B2C: the advertised price already includes VAT.
            tax_behavior: 'inclusive',
          },
        },
      ],
      metadata: {
        event_id: eventId,
        user_id: user.id,
        target_package: target,
        previous_package: current,
      },
      success_url: `${base}/dashboard/events/${eventId}?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${base}/dashboard/events/${eventId}?checkout=canceled`,
    })

    if (!session.url) return {error: 'stripe'}
    return {url: session.url}
  } catch {
    return {error: 'stripe'}
  }
}

// Called by the event page when the buyer returns from Stripe. Fetches the
// session, verifies it's paid and belongs to this user, and unlocks the package
// on the spot (idempotent with the webhook). Returns the unlocked package so the
// UI can update immediately instead of waiting for the async webhook.
export async function confirmCheckoutAction(sessionId: string): Promise<ConfirmResult> {
  const user = await getUser()
  if (!user) return {ok: false}

  try {
    const session = await getStripe().checkout.sessions.retrieve(sessionId)
    // Never fulfil a session that isn't paid or isn't this user's.
    if (session.payment_status !== 'paid') return {ok: false}
    if (session.metadata?.user_id !== user.id) return {ok: false}

    const target = session.metadata?.target_package
    if (!target || !isPaidPackage(target)) return {ok: false}

    await fulfillCheckoutSession(session)
    return {ok: true, package: target}
  } catch {
    return {ok: false}
  }
}
