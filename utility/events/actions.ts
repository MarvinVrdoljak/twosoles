'use server'

import {revalidatePath} from 'next/cache'
import {createClient} from '@/utility/supabase/server'
import {getUser} from '@/utility/supabase/user'
import {consentVersion, requiresWithdrawalConsent} from './withdrawal'

// `flipped` tells the caller whether THIS call actually started the event, so
// the analytics event fires once even if the button is double-clicked.
export type GoLiveResult =
  | {ok: true; startedAt: string; flipped: boolean}
  | {ok: false; error: 'auth' | 'notfound' | 'already' | 'consent' | 'failed'}

// Set an event live, server-side.
//
// This used to be a plain client-side update, which meant the § 356 Abs. 4/5 BGB
// declaration was only ever gated by a disabled button — RLS happily lets an
// owner update their own row, so the declaration could be skipped entirely while
// the terms promise it cannot. The requirement is therefore re-derived here from
// the database (never trusted from the client) and the update is refused without
// it.
export async function goLiveAction(
  eventId: string,
  locale: string,
  // Whether the user actually ticked the declaration. Only ever a claim from the
  // client; whether it was REQUIRED is decided here, from the database.
  consentGiven: boolean,
): Promise<GoLiveResult> {
  const user = await getUser()
  if (!user) return {ok: false, error: 'auth'}

  // RLS scopes this to the owner, so a foreign event id just comes back empty.
  const supabase = await createClient()
  const {data: event, error: readError} = await supabase
    .from('events')
    .select('id, started_at, withdrawal_consent_at')
    .eq('id', eventId)
    .maybeSingle()
  if (readError) return {ok: false, error: 'failed'}
  if (!event) return {ok: false, error: 'notfound'}
  if (event.started_at) return {ok: false, error: 'already'}

  // Free events have no payment row, so `orderedAt` stays null and no
  // declaration is ever due for them.
  const {data: lastPayment} = await supabase
    .from('event_payments')
    .select('created_at')
    .eq('event_id', eventId)
    .order('created_at', {ascending: false})
    .limit(1)
    .maybeSingle()

  const needsConsent = requiresWithdrawalConsent({
    startedAt: event.started_at as string | null,
    consentAt: event.withdrawal_consent_at as string | null,
    orderedAt: (lastPayment?.created_at as string | null) ?? null,
  })
  if (needsConsent && !consentGiven) return {ok: false, error: 'consent'}

  const startedAt = new Date().toISOString()
  const {data, error} = await supabase
    .from('events')
    .update({
      started_at: startedAt,
      // Stamped with the go-live itself, so the declaration can never drift
      // apart from the moment it covers.
      ...(needsConsent
        ? {withdrawal_consent_at: startedAt, withdrawal_consent_version: consentVersion(locale)}
        : {}),
    })
    .eq('id', eventId)
    // Idempotent: a second call updates no rows, so `flipped` stays false and
    // the go-live is never tracked twice.
    .is('started_at', null)
    .select('id')
  if (error) {
    console.error('[events/goLive] update failed', {eventId, error})
    return {ok: false, error: 'failed'}
  }

  revalidatePath('/[locale]/dashboard/events/[id]', 'page')
  return {ok: true, startedAt, flipped: (data?.length ?? 0) > 0}
}

const DAY = 24 * 60 * 60 * 1000
const HOUR = 60 * 60 * 1000

function dateStr(ms: number) {
  const d = new Date(ms)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function questions(count: number) {
  return Array.from({length: count}, (_, index) => ({text: `Dummy-Frage ${index + 1}`, custom: false}))
}

// DEV ONLY: wipe the current user's events and seed one event per status
// (draft / live / ended / expired). No photos. Guarded so it never runs in prod.
export async function seedDummyEventsAction() {
  if (process.env.NODE_ENV !== 'development') return

  const user = await getUser()
  if (!user) return

  const supabase = await createClient()
  await supabase.from('events').delete().eq('user_id', user.id)

  const now = Date.now()
  const base = {
    user_id: user.id,
    person1_color: '#a67070',
    person2_color: '#1f2937',
    game_language: 'de',
  }

  await supabase.from('events').insert([
    {
      // Entwurf: not started, date in the future.
      ...base,
      person1_name: 'Lena',
      person2_name: 'David',
      occasion: 'wedding',
      event_date: dateStr(now + 30 * DAY),
      package: 'medium',
      questions: questions(12),
      started_at: null,
    },
    {
      // Live: started 2h ago (within the 48h window).
      ...base,
      person1_name: 'Mia',
      person2_name: 'Jon',
      occasion: 'prewedding',
      event_date: dateStr(now + DAY),
      package: 'large',
      questions: questions(10),
      started_at: new Date(now - 2 * HOUR).toISOString(),
    },
    {
      // Beendet: started 3 days ago (past the 48h window).
      ...base,
      person1_name: 'Ann',
      person2_name: 'Ben',
      occasion: 'engagement',
      event_date: dateStr(now - 5 * DAY),
      package: 'medium',
      questions: questions(15),
      started_at: new Date(now - 3 * DAY).toISOString(),
    },
    {
      // Abgelaufen: never started, date in the past.
      ...base,
      person1_name: 'Sara',
      person2_name: 'Tom',
      occasion: 'golden_wedding',
      event_date: dateStr(now - 5 * DAY),
      package: 'free',
      questions: questions(8),
      started_at: null,
    },
  ])

  revalidatePath('/[locale]/dashboard', 'page')
}
