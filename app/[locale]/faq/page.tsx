import {getTranslations, setRequestLocale} from 'next-intl/server'
import {LayoutFaq} from '@/components/layout/LayoutFaq'
import type {Locale} from '@/i18n/routing'
import {pageMetadata} from '@/utility/seo'

type FaqPageProps = {
  params: Promise<{locale: Locale}>
}

type FaqCategory = {
  heading: string
  items: Array<{question: string; answer: string}>
}

export async function generateMetadata({params}: FaqPageProps) {
  const {locale} = await params
  const t = await getTranslations({locale, namespace: 'faqPage'})
  return pageMetadata({
    locale,
    href: '/faq',
    title: t('metaTitle'),
    description: t('metaDescription'),
  })
}

export default async function FaqPage({params}: FaqPageProps) {
  const {locale} = await params
  setRequestLocale(locale)

  // FAQ structured data (all categories flattened) so the page is eligible for
  // FAQ rich results in Google, same approach as the landing page.
  const t = await getTranslations({locale, namespace: 'faqPage'})
  const categories = t.raw('categories') as FaqCategory[]
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: categories
      .flatMap((category) => category.items)
      .map((item) => ({
        '@type': 'Question',
        name: item.question,
        acceptedAnswer: {'@type': 'Answer', text: item.answer},
      })),
  }

  return (
    <>
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{__html: JSON.stringify(jsonLd)}}
      />
      <LayoutFaq />
    </>
  )
}
