// Canonical, server-trusted pricing for the paid event packages. The display
// strings live in i18n (`pricing.tiers`); these are the amounts we actually
// charge — never trust a price coming from the client.
//
// Order matches PACKAGE_KEYS / pricing.tiers: free(0) small(1) medium(2) large(3).
// Amounts are in cents, EUR. B2C prices are tax-INCLUSIVE (the €29 already
// contains VAT); Managed Payments works out and remits the tax portion.

export type PaidPackage = 'small' | 'medium' | 'large'

export const PACKAGE_ORDER = ['free', 'small', 'medium', 'large'] as const
export type PackageKey = (typeof PACKAGE_ORDER)[number]

export const CURRENCY = 'eur'

// Full one-time price of each package, in cents.
export const PACKAGE_PRICE_CENTS: Record<PackageKey, number> = {
  free: 0,
  small: 2900,
  medium: 4900,
  large: 7900,
}

export function packageRank(pkg: string): number {
  const index = PACKAGE_ORDER.indexOf(pkg as PackageKey)
  return index === -1 ? 0 : index
}

export function isPaidPackage(pkg: string): pkg is PaidPackage {
  return pkg === 'small' || pkg === 'medium' || pkg === 'large'
}

// The Stripe Product id per paid tier (test/live differ, so they come from the
// env). We charge via inline `price_data` referencing this product, so the
// product's Managed-Payments-eligible tax code still applies while the amount
// (an upgrade may be only the difference) stays dynamic.
export function productIdFor(pkg: PaidPackage): string {
  const key =
    pkg === 'small'
      ? 'STRIPE_PRODUCT_SMALL'
      : pkg === 'medium'
        ? 'STRIPE_PRODUCT_MEDIUM'
        : 'STRIPE_PRODUCT_LARGE'
  const value = process.env[key]
  if (!value) {
    throw new Error(`Missing environment variable: ${key}`)
  }
  return value
}

// Amount to charge when moving from `current` to `target`: the difference in
// full price (a fresh purchase counts as an upgrade from `free`). Returns null
// when the target is not a strict, paid upgrade.
export function upgradeAmountCents(current: string, target: string): number | null {
  if (!isPaidPackage(target)) return null
  if (packageRank(target) <= packageRank(current)) return null
  const amount = PACKAGE_PRICE_CENTS[target] - PACKAGE_PRICE_CENTS[current as PackageKey]
  return amount > 0 ? amount : null
}
