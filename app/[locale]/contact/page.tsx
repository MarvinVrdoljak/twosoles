import {getTranslations, setRequestLocale} from 'next-intl/server'
import {LayoutContact} from '@/components/layout/LayoutContact'
import type {Locale} from '@/i18n/routing'

type ContactPageProps = {
  params: Promise<{locale: Locale}>
}

export async function generateMetadata({params}: ContactPageProps) {
  const {locale} = await params
  const t = await getTranslations({locale, namespace: 'contact'})
  return {title: t('metaTitle')}
}

export default async function ContactPage({params}: ContactPageProps) {
  const {locale} = await params
  setRequestLocale(locale)

  return <LayoutContact />
}
