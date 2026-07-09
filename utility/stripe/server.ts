import 'server-only'
import Stripe from 'stripe'

// Server-only Stripe client, created lazily so merely importing this module
// (e.g. during `next build`) never requires the secret — only the first actual
// call does. Managed Payments needs API version `2025-03-31.basil` or higher;
// we rely on the SDK's bundled version (currently `2026-06-24.dahlia`), which is
// well above that floor. Never import this from a Client Component.
let client: Stripe | null = null

export function getStripe(): Stripe {
  if (client) return client
  const secretKey = process.env.STRIPE_SECRET_KEY
  if (!secretKey) {
    throw new Error('Missing environment variable: STRIPE_SECRET_KEY')
  }
  client = new Stripe(secretKey)
  return client
}
