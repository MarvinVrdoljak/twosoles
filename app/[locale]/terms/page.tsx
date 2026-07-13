import {getTranslations, setRequestLocale} from 'next-intl/server'
import {LayoutLegal} from '@/components/layout/LayoutLegal'
import type {Locale} from '@/i18n/routing'
import {pageMetadata} from '@/utility/seo'

type TermsPageProps = {
  params: Promise<{locale: Locale}>
}

export async function generateMetadata({params}: TermsPageProps) {
  const {locale} = await params
  const t = await getTranslations({locale, namespace: 'legal'})
  return pageMetadata({
    locale,
    href: '/terms',
    title: t('terms.metaTitle'),
    description: t('terms.metaDescription'),
  })
}

export default async function TermsPage({params}: TermsPageProps) {
  const {locale} = await params
  setRequestLocale(locale)

  return <LayoutLegal page="terms" />
}
