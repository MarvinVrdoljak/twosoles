import {setRequestLocale} from 'next-intl/server'
import {notFound} from 'next/navigation'
import {GuestGame} from '@/components/game/GuestGame'
import type {Locale} from '@/i18n/routing'
import {guestCapacity} from '@/utility/game/capacity'
import type {PublicEvent} from '@/utility/game/types'
import {createClient} from '@/utility/supabase/server'

type GuestGamePageProps = {
  params: Promise<{locale: Locale; id: string}>
}

// Never index the game routes: they carry couple names/photos behind an
// unguessable UUID, so keep them out of search engines.
export const metadata = {robots: {index: false, follow: false}}

// Guest view (Gäste-Handy) — opened via QR, no login. Reads the event's public
// game data through get_public_event (owner-only columns stay hidden; the id
// argument is required, so no event is enumerable without its UUID).
// TODO: game-language locale.
export default async function GuestGamePage({params}: GuestGamePageProps) {
  const {locale, id} = await params
  setRequestLocale(locale)

  const supabase = await createClient()
  const {data: event} = await supabase
    .rpc('get_public_event', {event_id: id})
    .maybeSingle<PublicEvent>()

  if (!event) notFound()

  const questions = Array.isArray(event.questions)
    ? (event.questions as {text: string}[]).map((q) => q.text)
    : []

  return (
    <GuestGame
      eventId={id}
      coupleName={`${event.person1_name} & ${event.person2_name}`}
      person1={{name: event.person1_name, color: event.person1_color ?? '#a67070'}}
      person2={{name: event.person2_name, color: event.person2_color ?? '#1f2937'}}
      questions={questions}
      initialTheme={event.game_theme === 'dark' ? 'dark' : 'light'}
      capacity={guestCapacity(event.package, event.started_at != null)}
    />
  )
}
