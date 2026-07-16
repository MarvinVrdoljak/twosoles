// Contact-form subject keys, shared by the client form and the server action so
// both validate against the exact same list. Kept in a plain module (not the
// 'use server' action file, whose exports must all be async functions).
export const CONTACT_SUBJECTS = [
  'general',
  'event',
  'technical',
  'bigEvent',
  'feedback',
  'other',
] as const

export type ContactSubject = (typeof CONTACT_SUBJECTS)[number]

export function isContactSubject(value: string): value is ContactSubject {
  return (CONTACT_SUBJECTS as readonly string[]).includes(value)
}
