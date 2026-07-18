// Shared live-game model. The host device is the authority; display + guests
// subscribe to this state over Supabase Realtime (wired up with the host view).
export type GamePhase = 'lobby' | 'question' | 'closed' | 'countdown' | 'reveal' | 'finished'

export type GameTheme = 'light' | 'dark'

// One row of the public game data, as returned by the get_public_event RPC.
// The Supabase client is untyped, so the login-free screens cast the RPC result
// to this shape. Owner-only columns (host_pin, user_id, email, game_state) are
// never part of it — the function only selects the whitelisted columns.
export type PublicEvent = {
  id: string
  person1_name: string
  person2_name: string
  person1_color: string | null
  person2_color: string | null
  person1_photo: string | null
  person2_photo: string | null
  questions: unknown
  package: string
  game_theme: string
  // Go-live timestamp, or null while the event is still a draft. Drives the
  // guest-capacity gate: draft events are capped at the free tier (see
  // guestCapacity), the booked package only unlocks once this is set.
  started_at: string | null
}

export type GameState = {
  phase: GamePhase
  // Index into the event's question set.
  questionIndex: number
  // Live theme, controlled by the host — flips display + guest instantly.
  theme: GameTheme
  // Vote tally for the current question: [person1, person2].
  votes: [number, number]
  // Final tallies of already-revealed questions, keyed by question index.
  // Powers the host overview and restores a question's result on jump-back.
  results: Record<number, [number, number]>
}

export const INITIAL_GAME_STATE: GameState = {
  phase: 'lobby',
  questionIndex: 0,
  theme: 'light',
  votes: [0, 0],
  results: {},
}

// Countdown pacing, shared so the display sequence and the host's auto-advance
// stay in step. Each digit (3, 2, 1) animates in, holds for the beat below, then
// the next appears. The host reveals after COUNTDOWN_REVEAL_MS — sized to cover
// the display's appear + three digit cycles + a final hold on "1", so the last
// digit is never cut off.
export const COUNTDOWN_DIGIT_HOLD_MS = 800
export const COUNTDOWN_REVEAL_MS = 4400
