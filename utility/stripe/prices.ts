import 'server-only'
import {unstable_cache} from 'next/cache'
import {getStripe} from './server'
import {formatPrice} from './format'
import {PACKAGE_ORDER, isPaidPackage, productIdFor, type PaidPackage} from './packages'

// Single source of truth for the paid-package pricing: read straight from
// Stripe. Every teaser, preview and the checkout amount derive from this — there
// are no hardcoded prices in the app anymore. Each Stripe Product carries a
// default Price; we read its amount + currency from there.

export type PackagePrice = {amountCents: number; currency: string}
export type PaidPackagePrices = Record<PaidPackage, PackagePrice>

const PAID: PaidPackage[] = ['small', 'medium', 'large']

async function fetchPaidPackagePrices(): Promise<PaidPackagePrices> {
  const stripe = getStripe()
  const entries = await Promise.all(
    PAID.map(async (pkg) => {
      const product = await stripe.products.retrieve(productIdFor(pkg), {
        expand: ['default_price'],
      })
      const price = product.default_price
      if (!price || typeof price === 'string' || price.unit_amount == null) {
        throw new Error(`Stripe product for "${pkg}" has no usable default price`)
      }
      return [pkg, {amountCents: price.unit_amount, currency: price.currency}] as const
    }),
  )
  return Object.fromEntries(entries) as PaidPackagePrices
}

// Cached across requests (revalidated hourly) so the public landing/teaser
// pages don't hit the Stripe API on every render. Product ids are fixed per
// deployment, so a single cache key is enough; bump via the `stripe-prices` tag.
export const getPaidPackagePrices = unstable_cache(
  fetchPaidPackagePrices,
  ['stripe-paid-package-prices'],
  {revalidate: 3600, tags: ['stripe-prices']},
)

// Display strings for the whole tier list (index-aligned with PACKAGE_ORDER /
// pricing.tiers): the free tier shows the localized `freeLabel`, the paid tiers
// show their formatted Stripe price.
export async function getTierPriceDisplays(locale: string, freeLabel: string): Promise<string[]> {
  const prices = await getPaidPackagePrices()
  return PACKAGE_ORDER.map((pkg) =>
    isPaidPackage(pkg) ? formatPrice(prices[pkg].amountCents, prices[pkg].currency, locale) : freeLabel,
  )
}
