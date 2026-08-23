// When a paid event needs the § 356 Abs. 4/5 BGB declaration, and when it does
// not.
//
// The 14-day withdrawal period runs from the order. The service is only ever
// consumed by setting the event live: until then the event sits on the free
// capacity whatever was paid (see utility/game/capacity.ts). So the declaration
// is only meaningful at go-live, and only while the period is still running.
//
// Book in May for a September wedding and the period is long over before the
// game happens: nothing to declare, nobody gets asked. Book three days before
// the party and the declaration appears, because that is the one case where the
// service would otherwise be consumed and refunded in full afterwards.

export const WITHDRAWAL_DAYS = 14

const DAY_MS = 24 * 60 * 60 * 1000

// Revision of the declaration wording in `eventDetail.goLiveConfirm.consent*`.
// BUMP THIS whenever that text changes: stored events keep pointing at the
// version their owner actually saw, which is the whole point of keeping it.
export const CONSENT_WORDING = 'r4'

export function consentVersion(locale: string): string {
  return `${CONSENT_WORDING}-${locale === 'en' ? 'en' : 'de'}`
}

// End of the withdrawal period for an order placed at `orderedAt`.
export function withdrawalDeadline(orderedAt: Date): Date {
  return new Date(orderedAt.getTime() + WITHDRAWAL_DAYS * DAY_MS)
}

// True while a paid order can still be withdrawn, i.e. while going live would
// cost the buyer their right and therefore needs the declaration.
export function isWithinWithdrawalPeriod(
  orderedAt: string | null,
  now: Date = new Date(),
): boolean {
  if (!orderedAt) return false
  const ordered = new Date(orderedAt)
  if (Number.isNaN(ordered.getTime())) return false
  return now.getTime() < withdrawalDeadline(ordered).getTime()
}

// The one rule that decides whether the declaration is due, shared by the page
// (which renders the checkbox) and the go-live action (which enforces it). Kept
// in a single place on purpose: if the UI gate and the server gate could drift,
// the server would start rejecting go-lives the user was never asked about.
//
// `orderedAt` is null for a free event, which has no withdrawal right at all
// (§ 312 Abs. 1a BGB), so those never reach the deadline check.
export function requiresWithdrawalConsent(
  input: {
    startedAt: string | null
    consentAt: string | null
    orderedAt: string | null
  },
  now: Date = new Date(),
): boolean {
  if (input.startedAt) return false
  if (input.consentAt) return false
  return isWithinWithdrawalPeriod(input.orderedAt, now)
}
