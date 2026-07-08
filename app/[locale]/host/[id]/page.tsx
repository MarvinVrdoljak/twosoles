import {setRequestLocale} from 'next-intl/server'
import {notFound} from 'next/navigation'
import {HostGame} from '@/components/game/HostGame'
import {HostPinGate} from '@/components/game/HostPinGate'
import type {Locale} from '@/i18n/routing'
import {isHostVerified} from '@/utility/game/hostSession'
import {createClient} from '@/utility/supabase/server'

type HostGamePageProps = {
  params: Promise<{locale: Locale; id: string}>
}

// Never index the game routes: they carry couple names/photos behind an
// unguessable UUID, so keep them out of search engines.
export const metadata = {robots: {index: false, follow: false}}

// Host control view (Host-Steuerung) — drives the game. Login-free: gated by the
// event's 4-digit PIN instead of an account, so the host can open it as easily
// as guests join. Reads only public columns (via public_events); the PIN itself
// never reaches the client.
export default async function HostGamePage({params}: HostGamePageProps) {
  const {locale, id} = await params
  setRequestLocale(locale)

  const supabase = await createClient()
  const {data: event} = await supabase
    .from('public_events')
    .select('person1_name, person2_name, person1_color, person2_color, questions')
    .eq('id', id)
    .maybeSingle()

  if (!event) notFound()

  const coupleName = `${event.person1_name} & ${event.person2_name}`

  if (!(await isHostVerified(id))) {
    return <HostPinGate eventId={id} coupleName={coupleName} />
  }

  const questions = Array.isArray(event.questions)
    ? (event.questions as {text: string}[]).map((q) => q.text)
    : []

  return (
    <HostGame
      eventId={id}
      person1={{name: event.person1_name, color: event.person1_color ?? '#a67070'}}
      person2={{name: event.person2_name, color: event.person2_color ?? '#1f2937'}}
      questions={questions}
    />
  )
}
