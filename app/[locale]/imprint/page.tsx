import {getTranslations, setRequestLocale} from 'next-intl/server'
import {LayoutLegal} from '@/components/layout/LayoutLegal'
import type {Locale} from '@/i18n/routing'
import {pageMetadata} from '@/utility/seo'

type ImprintPageProps = {
  params: Promise<{locale: Locale}>
}

export async function generateMetadata({params}: ImprintPageProps) {
  const {locale} = await params
  const t = await getTranslations({locale, namespace: 'legal'})
  return pageMetadata({
    locale,
    href: '/imprint',
    title: t('imprint.metaTitle'),
    description: t('imprint.metaDescription'),
  })
}

export default async function ImprintPage({params}: ImprintPageProps) {
  const {locale} = await params
  setRequestLocale(locale)

  return <LayoutLegal page="imprint" />
}
