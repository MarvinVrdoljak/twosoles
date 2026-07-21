import {setRequestLocale} from 'next-intl/server'
import {notFound} from 'next/navigation'
import {CoupleGate} from '@/components/game/CoupleGate'
import type {Locale} from '@/i18n/routing'
import {guestCapacity} from '@/utility/game/capacity'
import type {PublicEvent} from '@/utility/game/types'
import {createClient} from '@/utility/supabase/server'

type CoupleGamePageProps = {
  params: Promise<{locale: Locale; id: string}>
  searchParams: Promise<{p?: string}>
}

// Never index the game routes: they carry couple names/photos behind an
// unguessable UUID, so keep them out of search engines.
export const metadata = {robots: {index: false, follow: false}}

// Couple view (phone mode) — the link the host hands to the bride/groom. Both
// partners open it and pick who they are on the first screen; their pick is
// recorded as the couple's own answer rather than a public vote. `?p=1|2` only
// pre-highlights a partner on the picker (from a per-partner link), it never
// assigns silently. Login-free, reads only public columns via get_public_event.
export default async function CoupleGamePage({params, searchParams}: CoupleGamePageProps) {
  const {locale, id} = await params
  const {p} = await searchParams
  setRequestLocale(locale)

  const suggestedSlot: 0 | 1 | null = p === '1' ? 0 : p === '2' ? 1 : null

  const supabase = await createClient()
  const {data: event} = await supabase
    .rpc('get_public_event', {event_id: id})
    .maybeSingle<PublicEvent>()

  if (!event) notFound()

  const questions = Array.isArray(event.questions)
    ? (event.questions as {text: string}[]).map((q) => q.text)
    : []

  return (
    <CoupleGate
      eventId={id}
      coupleName={`${event.person1_name} & ${event.person2_name}`}
      person1={{name: event.person1_name, color: event.person1_color ?? '#a67070'}}
      person2={{name: event.person2_name, color: event.person2_color ?? '#1f2937'}}
      questions={questions}
      initialTheme={event.game_theme === 'dark' ? 'dark' : 'light'}
      capacity={guestCapacity(event.package, event.started_at != null)}
      suggestedSlot={suggestedSlot}
    />
  )
}
