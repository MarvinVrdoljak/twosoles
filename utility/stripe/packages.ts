// Identity + ordering for the event packages. Prices are NOT kept here: they
// live solely in Stripe and are read via `./prices`. Display strings (tier
// names/taglines) live in i18n (`pricing.tiers`); the amounts we charge come
// from each Stripe Product's default price. B2C prices are tax-INCLUSIVE (the
// advertised price already contains VAT); Managed Payments remits the tax.
//
// Order matches PACKAGE_KEYS / pricing.tiers: free(0) small(1) medium(2) large(3).

export type PaidPackage = 'small' | 'medium' | 'large'

export const PACKAGE_ORDER = ['free', 'small', 'medium', 'large'] as const
export type PackageKey = (typeof PACKAGE_ORDER)[number]

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
