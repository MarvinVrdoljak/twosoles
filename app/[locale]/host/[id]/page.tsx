import {setRequestLocale} from 'next-intl/server'
import {LayoutGameStub} from '@/components/layout/LayoutGameStub'
import type {Locale} from '@/i18n/routing'

type HostGamePageProps = {
  params: Promise<{locale: Locale; id: string}>
}

// Host control view (Host-Steuerung) — the host's device drives the game.
// Placeholder for now; only wires up the routing.
export default async function HostGamePage({params}: HostGamePageProps) {
  const {locale, id} = await params
  setRequestLocale(locale)

  return <LayoutGameStub view="host" id={id} />
}
