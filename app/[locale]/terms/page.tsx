import {setRequestLocale} from 'next-intl/server'
import {LayoutLegal} from '@/components/layout/LayoutLegal'
import type {Locale} from '@/i18n/routing'

type TermsPageProps = {
  params: Promise<{locale: Locale}>
}

export default async function TermsPage({params}: TermsPageProps) {
  const {locale} = await params
  setRequestLocale(locale)

  return <LayoutLegal page="terms" />
}
