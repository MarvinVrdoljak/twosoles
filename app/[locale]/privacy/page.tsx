import {setRequestLocale} from 'next-intl/server'
import {LayoutLegal} from '@/components/layout/LayoutLegal'
import type {Locale} from '@/i18n/routing'

type PrivacyPageProps = {
  params: Promise<{locale: Locale}>
}

export default async function PrivacyPage({params}: PrivacyPageProps) {
  const {locale} = await params
  setRequestLocale(locale)

  return <LayoutLegal page="privacy" />
}
