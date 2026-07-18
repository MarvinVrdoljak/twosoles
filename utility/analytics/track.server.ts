import 'server-only'
import {track} from '@vercel/analytics/server'
import type {AnalyticsEvents} from './events'

// Server-side analytics (API routes, server actions, fulfilment). Same typed
// contract as the client wrapper, but best-effort: analytics must never break the
// business flow it's observing, so a failed send is swallowed. We still await so
// the request doesn't return before the event flushes.
export async function trackEventServer<E extends keyof AnalyticsEvents>(
  ...args: AnalyticsEvents[E] extends undefined
    ? [event: E]
    : [event: E, properties: AnalyticsEvents[E]]
) {
  const [event, properties] = args
  try {
    await track(event, properties as Record<string, string | number | boolean | null> | undefined)
  } catch {
    // Ignore — analytics is non-critical.
  }
}
