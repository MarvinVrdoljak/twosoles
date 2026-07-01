import {setRequestLocale} from 'next-intl/server'
import {LayoutLegal} from '@/components/layout/LayoutLegal'
import type {Locale} from '@/i18n/routing'

type ImprintPageProps = {
  params: Promise<{locale: Locale}>
}

export default async function ImprintPage({params}: ImprintPageProps) {
  const {locale} = await params
  setRequestLocale(locale)

  return <LayoutLegal page="imprint" />
}
