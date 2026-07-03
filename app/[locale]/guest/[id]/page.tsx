import {setRequestLocale} from 'next-intl/server'
import {LayoutGameStub} from '@/components/layout/LayoutGameStub'
import type {Locale} from '@/i18n/routing'

type GuestGamePageProps = {
  params: Promise<{locale: Locale; id: string}>
}

// Guest view (Gäste-Handy) — opened by guests via QR code, no login.
// Placeholder for now; only wires up the routing.
export default async function GuestGamePage({params}: GuestGamePageProps) {
  const {locale, id} = await params
  setRequestLocale(locale)

  return <LayoutGameStub view="guest" id={id} />
}
