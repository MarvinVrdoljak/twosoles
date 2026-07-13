import {getTranslations, setRequestLocale} from 'next-intl/server'
import {LayoutLegal} from '@/components/layout/LayoutLegal'
import type {Locale} from '@/i18n/routing'
import {pageMetadata} from '@/utility/seo'

type PrivacyPageProps = {
  params: Promise<{locale: Locale}>
}

export async function generateMetadata({params}: PrivacyPageProps) {
  const {locale} = await params
  const t = await getTranslations({locale, namespace: 'legal'})
  return pageMetadata({
    locale,
    href: '/privacy',
    title: t('privacy.metaTitle'),
    description: t('privacy.metaDescription'),
  })
}

export default async function PrivacyPage({params}: PrivacyPageProps) {
  const {locale} = await params
  setRequestLocale(locale)

  return <LayoutLegal page="privacy" />
}
