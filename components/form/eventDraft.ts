import type {AnswerMode, GameTheme} from '@/utility/game/types'

// Shared shape for the event-creation wizard. Held in the wizard's client state
// and passed down to each step. Nothing is persisted yet — saving + payment
// (Supabase + Stripe) are wired up later.
export type EventQuestion = {
  id: string
  text: string
}

export type EventDraft = {
  name1: string
  name2: string
  color1: string
  color2: string
  // Local preview object URLs; the actual files are kept separately for upload.
  photo1: string | null
  photo2: string | null
  photo1File: File | null
  photo2File: File | null
  occasion: string
  date: string
  language: string
  // Default colour scheme for the game screens (light or dark). The host can
  // still flip it live; this is the event's starting theme.
  theme: GameTheme
  // How the couple answers: 'shoe' (host enters what they raised) or 'phone'
  // (couple votes secretly on their own devices). Fixed for the whole game.
  answerMode: AnswerMode
  questions: EventQuestion[]
  packageIndex: number
}

// Frontend tier order (matches pricing.tiers) → backend package enum. Display
// names stay in i18n; the DB stores the neutral keys.
export const PACKAGE_KEYS = ['free', 'small', 'medium', 'large'] as const

// Local "today" as yyyy-mm-dd — used as the date default and the earliest
// selectable date (no past dates).
export function todayISODate(): string {
  const now = new Date()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${now.getFullYear()}-${month}-${day}`
}

// Latest selectable celebration date as yyyy-mm-dd: 10 years from today. Keeps
// the date picker within a sensible range.
export function maxEventISODate(): string {
  const now = new Date()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${now.getFullYear() + 10}-${month}-${day}`
}

// True when `date` (yyyy-mm-dd) sits within [today, today + 10 years]. The date
// input's min/max only constrain the picker — manual typing bypasses them — so
// this backs them up on save/step gating. ISO dates compare lexicographically.
export function isEventDateInRange(date: string): boolean {
  return date >= todayISODate() && date <= maxEventISODate()
}

// Preset button colours the couple can pick from a dropdown (step 1).
export const PERSON_COLORS = [
  '#a67070',
  '#1f2937',
  '#c98b6b',
  '#6b8e9e',
  '#8a9a5b',
  '#7a6a9e',
  '#4c9a8f',
]
