import type {PACKAGE_KEYS} from '@/components/form/eventDraft'

// The complete list of product analytics events we send to Vercel Web Analytics,
// with the (categorical) properties each one carries. Keep this list SHORT and
// every value strictly NON-personal — no names, e-mails, event ids or host pins,
// only funnel/tier data. Vercel Web Analytics is cookieless and anonymous, so as
// long as nothing here identifies a person, sending these needs no cookie banner
// and no extra consent. This map is the single guard-rail: `trackEvent` only
// accepts these names, and TypeScript rejects any property not declared here.
//
// Note: custom events are a Pro-plan feature. On the Hobby (free) plan these
// calls are harmless no-ops — nothing is collected until the team is on Pro.
//
// Vercel allows at most 2 properties per event on Pro, so keep each entry small.
export type PackageKey = (typeof PACKAGE_KEYS)[number]

export type AnalyticsEvents = {
  // Wizard opened — top of the create funnel.
  event_create_started: undefined
  // Event row created (always as `free` first); `package` is the tier the user
  // *selected*, i.e. their purchase intent.
  event_created: {package: PackageKey}
  // Payment confirmed by Stripe; `package` is the tier that was paid for. Fired
  // server-side, exactly once per session (deduped on the unique Stripe session).
  checkout_paid: {package: PackageKey}
  // Host set the event live in the settings (start_at committed, one-time 48h
  // window) — a real go-live, not a test run of the host screen.
  game_hosted: undefined
}

export type AnalyticsEventName = keyof AnalyticsEvents
