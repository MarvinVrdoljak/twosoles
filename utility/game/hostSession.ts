import {cookies} from 'next/headers'

// The host controls are gated by the event's 4-digit PIN instead of a login.
// Once a PIN is verified we drop a per-event cookie so the host isn't re-prompted
// on every navigation/refresh. httpOnly keeps it out of client JS.
//
// This is intentionally *soft* protection: the Realtime game channel itself is
// unauthenticated (any subscriber can broadcast), so the PIN only keeps casual
// guests out of the control panel — it is not a hard security boundary. If the
// channel is ever locked down, sign this cookie (HMAC over the event id).

const cookieName = (eventId: string) => `ts_host_${eventId}`

const MAX_AGE_SECONDS = 60 * 60 * 12 // 12h — long enough for an event, then expires.

export async function isHostVerified(eventId: string): Promise<boolean> {
  const store = await cookies()
  return store.get(cookieName(eventId))?.value === '1'
}

export async function markHostVerified(eventId: string): Promise<void> {
  const store = await cookies()
  store.set(cookieName(eventId), '1', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: MAX_AGE_SECONDS,
  })
}
