import {setRequestLocale} from 'next-intl/server'
import {LayoutGameStub} from '@/components/layout/LayoutGameStub'
import type {Locale} from '@/i18n/routing'

type DisplayGamePageProps = {
  params: Promise<{locale: Locale; id: string}>
}

// Display view (Leinwand) — shown on the beamer for everyone.
// Placeholder for now; only wires up the routing.
export default async function DisplayGamePage({params}: DisplayGamePageProps) {
  const {locale, id} = await params
  setRequestLocale(locale)

  return <LayoutGameStub view="display" id={id} />
}
