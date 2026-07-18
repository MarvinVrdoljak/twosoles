import {track} from '@vercel/analytics'
import type {AnalyticsEvents} from './events'

// Client-side analytics. Thin, typed wrapper around Vercel's `track()` so every
// call site is constrained to the events + properties declared in `events.ts`.
// Events without properties take no second argument; events with properties
// require the exact shape. See events.ts for the PII/consent guard-rails.
export function trackEvent<E extends keyof AnalyticsEvents>(
  ...args: AnalyticsEvents[E] extends undefined
    ? [event: E]
    : [event: E, properties: AnalyticsEvents[E]]
) {
  const [event, properties] = args
  track(event, properties as Record<string, string | number | boolean | null> | undefined)
}
