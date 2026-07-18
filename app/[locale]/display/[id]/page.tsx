import {headers} from 'next/headers'
import {setRequestLocale} from 'next-intl/server'
import {notFound} from 'next/navigation'
import {DisplayGame} from '@/components/game/DisplayGame'
import type {Locale} from '@/i18n/routing'
import {guestCapacity} from '@/utility/game/capacity'
import type {PublicEvent} from '@/utility/game/types'
import {createClient} from '@/utility/supabase/server'
import {createServiceClient} from '@/utility/supabase/service'

type DisplayGamePageProps = {
  params: Promise<{locale: Locale; id: string}>
}

// Never index the game routes: they carry couple names/photos behind an
// unguessable UUID, so keep them out of search engines.
export const metadata = {robots: {index: false, follow: false}}

// Display view (Leinwand) — shown on the beamer, no login. Reads the event's
// public game data through get_public_event and renders the live board.
export default async function DisplayGamePage({params}: DisplayGamePageProps) {
  const {locale, id} = await params
  setRequestLocale(locale)

  const supabase = await createClient()
  const {data: event} = await supabase
    .rpc('get_public_event', {event_id: id})
    .maybeSingle<PublicEvent>()

  if (!event) notFound()

  // Sign the couple photos with the service role, NOT the anon client. The
  // bucket is private and anon no longer has any access to storage.objects (see
  // the migration dropping "Public can read event photos"), so the beamer can't
  // be used to enumerate or read other events' photos. This server component
  // signs short-lived URLs only for the event it already resolved above.
  const service = createServiceClient()
  const sign = async (path: string | null) => {
    if (!path) return null
    const {data} = await service.storage.from('event-photos').createSignedUrl(path, 3600)
    return data?.signedUrl ?? null
  }
  const [photo1, photo2] = await Promise.all([
    sign(event.person1_photo),
    sign(event.person2_photo),
  ])

  const questions = Array.isArray(event.questions)
    ? (event.questions as {text: string}[]).map((q) => q.text)
    : []

  // The QR must encode the REAL guest route. Derive the absolute origin from the
  // request (works on localhost:3001, previews and prod) and point at
  // /guest/<full id> — a truncated id or missing /guest/ segment would 404, and
  // the QR is the only way guests join.
  const h = await headers()
  const host = h.get('x-forwarded-host') ?? h.get('host')
  const proto = h.get('x-forwarded-proto') ?? (host?.startsWith('localhost') ? 'http' : 'https')
  const base = host
    ? `${proto}://${host}`
    : (process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3001')

  return (
    <DisplayGame
      eventId={id}
      coupleName={`${event.person1_name} & ${event.person2_name}`}
      person1={{name: event.person1_name, color: event.person1_color ?? '#a67070', photo: photo1}}
      person2={{name: event.person2_name, color: event.person2_color ?? '#1f2937', photo: photo2}}
      questions={questions}
      guestUrl={`${base}/guest/${id}`}
      initialTheme={event.game_theme === 'dark' ? 'dark' : 'light'}
      capacity={guestCapacity(event.package, event.started_at != null)}
    />
  )
}
