import {getTranslations, setRequestLocale} from 'next-intl/server'
import {redirect} from 'next/navigation'
import {BlockCta} from '@/components/blocks/BlockCta'
import {BlockFaq} from '@/components/blocks/BlockFaq'
import {BlockHero} from '@/components/blocks/BlockHero'
import {BlockPricing} from '@/components/blocks/BlockPricing'
import {BlockQuote} from '@/components/blocks/BlockQuote'
import {BlockSteps} from '@/components/blocks/BlockSteps'
import {BlockTestimonials} from '@/components/blocks/BlockTestimonials'
import {BlockTicker} from '@/components/blocks/BlockTicker'
import {GlobalFooter} from '@/components/globals/GlobalFooter'
import {GlobalHeader} from '@/components/globals/GlobalHeader'
import {getPathname} from '@/i18n/navigation'
import type {Locale} from '@/i18n/routing'
import {getBaseUrl, pageMetadata} from '@/utility/seo'
import {getUser} from '@/utility/supabase/user'

type HomeProps = {
  params: Promise<{locale: Locale}>
}

export async function generateMetadata({params}: HomeProps) {
  const {locale} = await params
  const t = await getTranslations({locale, namespace: 'home'})
  return pageMetadata({
    locale,
    href: '/',
    title: t('metaTitle'),
    description: t('metaDescription'),
    absoluteTitle: true,
  })
}

// Public marketing landing page — only for visitors who are NOT signed in.
// Authenticated users are sent straight to the host area.
export default async function Home({params}: HomeProps) {
  const {locale} = await params
  setRequestLocale(locale)

  if (await getUser()) {
    redirect(getPathname({href: '/dashboard', locale}))
  }

  const baseUrl = getBaseUrl()
  const home = await getTranslations({locale, namespace: 'home'})
  const faq = await getTranslations({locale, namespace: 'faq'})
  const faqItems = faq.raw('items') as Array<{question: string; answer: string}>

  // Structured data for rich results: brand identity, site-level search intent,
  // and the FAQ (eligible for FAQ rich snippets in Google).
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': `${baseUrl}/#organization`,
        name: 'TwoSoles',
        url: baseUrl,
        logo: `${baseUrl}/favicon/favicon-96x96.png`,
      },
      {
        '@type': 'WebSite',
        '@id': `${baseUrl}/#website`,
        url: baseUrl,
        name: 'TwoSoles',
        description: home('metaDescription'),
        inLanguage: locale,
        publisher: {'@id': `${baseUrl}/#organization`},
      },
      {
        '@type': 'FAQPage',
        mainEntity: faqItems.map((item) => ({
          '@type': 'Question',
          name: item.question,
          acceptedAnswer: {'@type': 'Answer', text: item.answer},
        })),
      },
    ],
  }

  return (
    <>
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{__html: JSON.stringify(jsonLd)}}
      />
      <GlobalHeader />
      <main>
        <BlockHero />
        <BlockTicker />
        <BlockSteps />
        <BlockQuote />
        <BlockPricing />
        <BlockTestimonials />
        <BlockFaq />
        <BlockCta />
      </main>
      <GlobalFooter />
    </>
  )
}
