export type EventStatus = 'draft' | 'live' | 'ended' | 'expired'

const LIVE_WINDOW_MS = 48 * 60 * 60 * 1000

// Status is derived, never stored: not started + future/today = draft; not
// started + past date = expired; started within 48h = live; started + older = ended.
export function deriveStatus(input: {
  started_at: string | null
  event_date: string | null
}): EventStatus {
  if (input.started_at) {
    const started = new Date(input.started_at).getTime()
    return Date.now() < started + LIVE_WINDOW_MS ? 'live' : 'ended'
  }
  if (input.event_date) {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    if (new Date(`${input.event_date}T00:00:00`).getTime() < today.getTime()) {
      return 'expired'
    }
  }
  return 'draft'
}
