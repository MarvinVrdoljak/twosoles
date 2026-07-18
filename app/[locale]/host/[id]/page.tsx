import {setRequestLocale} from 'next-intl/server'
import {notFound} from 'next/navigation'
import {HostGame} from '@/components/game/HostGame'
import {HostPinGate} from '@/components/game/HostPinGate'
import type {Locale} from '@/i18n/routing'
import {guestCapacity} from '@/utility/game/capacity'
import {isHostVerified} from '@/utility/game/hostSession'
import type {GameState, PublicEvent} from '@/utility/game/types'
import {createClient} from '@/utility/supabase/server'
import {createServiceClient} from '@/utility/supabase/service'

type HostGamePageProps = {
  params: Promise<{locale: Locale; id: string}>
}

// Never index the game routes: they carry couple names/photos behind an
// unguessable UUID, so keep them out of search engines.
export const metadata = {robots: {index: false, follow: false}}

// Host control view (Host-Steuerung) — drives the game. Login-free: gated by the
// event's 4-digit PIN instead of an account, so the host can open it as easily
// as guests join. Reads only public columns (via get_public_event); the PIN
// itself never reaches the client.
export default async function HostGamePage({params}: HostGamePageProps) {
  const {locale, id} = await params
  setRequestLocale(locale)

  const supabase = await createClient()
  const {data: event} = await supabase
    .rpc('get_public_event', {event_id: id})
    .maybeSingle<PublicEvent>()

  if (!event) notFound()

  const coupleName = `${event.person1_name} & ${event.person2_name}`

  // The signed-in owner never needs the PIN on their own device. The events
  // table is RLS-scoped to the owner, so this select returns a row only for
  // them (empty for other logged-in users, denied for anon) — a clean ownership
  // check without exposing user_id through the public game function.
  const {data: owned} = await supabase.from('events').select('id').eq('id', id).maybeSingle()
  const isOwner = owned != null

  if (!isOwner && !(await isHostVerified(id))) {
    return <HostPinGate eventId={id} coupleName={coupleName} />
  }

  const questions = Array.isArray(event.questions)
    ? (event.questions as {text: string}[]).map((q) => q.text)
    : []

  // Resume the game after a host reload/disconnect: read the persisted snapshot
  // (owner-only column, so via the service client) and seed the host with it.
  // Best-effort — if it's unavailable the host just starts from the lobby.
  let initialState: GameState | null = null
  try {
    const service = createServiceClient()
    const {data} = await service.from('events').select('game_state').eq('id', id).maybeSingle()
    initialState = (data?.game_state as GameState | null) ?? null
  } catch {
    initialState = null
  }

  return (
    <HostGame
      eventId={id}
      person1={{name: event.person1_name, color: event.person1_color ?? '#a67070'}}
      person2={{name: event.person2_name, color: event.person2_color ?? '#1f2937'}}
      questions={questions}
      initialTheme={event.game_theme === 'dark' ? 'dark' : 'light'}
      capacity={guestCapacity(event.package, event.started_at != null)}
      initialState={initialState}
      isDraft={event.started_at == null}
    />
  )
}
