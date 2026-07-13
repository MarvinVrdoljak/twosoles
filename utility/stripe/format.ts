// Locale-aware money formatting shared by every price teaser/preview. Amounts
// come from Stripe as minor units (cents) + an ISO currency; this turns them
// into the display string ("29 €" in de, "€29" in en). Whole amounts drop the
// decimals so a €29.00 tier reads as "29 €", not "29,00 €".
export function formatPrice(amountCents: number, currency: string, locale: string): string {
  const whole = amountCents % 100 === 0
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency.toUpperCase(),
    minimumFractionDigits: whole ? 0 : 2,
    maximumFractionDigits: whole ? 0 : 2,
  }).format(amountCents / 100)
}
