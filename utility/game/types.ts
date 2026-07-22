// Shared live-game model. The host device is the authority; display + guests
// subscribe to this state over Supabase Realtime (wired up with the host view).
// coupleReveal shows the couple's own picks first; the host then clicks on to
// 'reveal', which brings in the audience result. coupleReveal is skipped when the
// couple didn't answer the question.
export type GamePhase =
  | 'lobby'
  | 'question'
  | 'closed'
  | 'countdown'
  | 'coupleReveal'
  | 'reveal'
  | 'finished'

export type GameTheme = 'light' | 'dark'

// How the couple's own answer is captured. Fixed per event (not flipped live):
//   'shoe'  = couple raises shoes, the host taps in what each partner showed.
//   'phone' = couple answers secretly on their own phones.
export type AnswerMode = 'shoe' | 'phone'

// The couple's answer to one question: what each partner picked, on the same
// [person1, person2] axis as the audience votes. Index 0 = person1, 1 = person2.
// They "match" when both partners picked the same person.
export type CoupleAnswer = [number, number]

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
  answer_mode: string
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
  // The couple's own answer per question, keyed by question index. Filled by the
  // host (shoe mode) or by the couple's phones (phone mode); read mode-agnostic
  // by the reveal/match/scoring layer. Absent until the couple has answered.
  coupleAnswers: Record<number, CoupleAnswer>
}

export const INITIAL_GAME_STATE: GameState = {
  phase: 'lobby',
  questionIndex: 0,
  theme: 'light',
  votes: [0, 0],
  results: {},
  coupleAnswers: {},
}

// Countdown pacing, shared so the display sequence and the host's auto-advance
// stay in step. Each digit (3, 2, 1) animates in, holds for the beat below, then
// the next appears. The host reveals after COUNTDOWN_REVEAL_MS — sized to cover
// the display's appear + three digit cycles + a final hold on "1", so the last
// digit is never cut off.
export const COUNTDOWN_DIGIT_HOLD_MS = 800
export const COUNTDOWN_REVEAL_MS = 4400

// Sentinel for a couple slot not yet answered. A CoupleAnswer with either slot
// still -1 is "incomplete" and hidden from the reveal + scoring.
export const COUPLE_UNSET = -1

// True once both partners have picked for a question.
export function coupleAnswered(pair: CoupleAnswer | undefined): pair is CoupleAnswer {
  return pair !== undefined && pair[0] >= 0 && pair[1] >= 0
}

// The partners agree when they pointed at the same person.
export function coupleMatches(pair: CoupleAnswer): boolean {
  return pair[0] === pair[1]
}

// Which person the audience leaned toward, or -1 on a tie (50/50, or no votes).
// A tie has no majority, so the room is counted as wrong — it never equals a
// couple pick (always 0 or 1).
export function audienceMajority(votes: [number, number]): 0 | 1 | -1 {
  if (votes[0] === votes[1]) return -1
  return votes[0] > votes[1] ? 0 : 1
}
