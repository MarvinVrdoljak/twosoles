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
import {isPaidPackage, PACKAGE_ORDER} from '@/utility/stripe/packages'
import {getPaidPackagePrices} from '@/utility/stripe/prices'
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
  const pricing = await getTranslations({locale, namespace: 'pricing'})
  const faqItems = faq.raw('items') as Array<{question: string; answer: string}>
  const tiers = pricing.raw('tiers') as Array<{
    name: string
    tagline: string
    capacity: string
    free?: boolean
  }>

  // Live Stripe prices (same source as the pricing block, no hardcoded amounts)
  // power the Offer schema, so the structured data can never drift from reality.
  const paidPrices = await getPaidPackagePrices()
  const currency = paidPrices.small.currency.toUpperCase()
  // One Offer per package, index-aligned with PACKAGE_ORDER / pricing.tiers.
  const offers = PACKAGE_ORDER.map((pkg, index) => {
    const tier = tiers[index]
    const priceCents = isPaidPackage(pkg) ? paidPrices[pkg].amountCents : 0
    return {
      '@type': 'Offer',
      name: tier.name,
      description: tier.tagline,
      price: (priceCents / 100).toFixed(2),
      priceCurrency: currency,
      // One-off purchase per event, no subscription.
      availability: 'https://schema.org/InStock',
    }
  })
  const highPriceCents = Math.max(...PACKAGE_ORDER.filter(isPaidPackage).map((p) => paidPrices[p].amountCents))

  // Structured data for rich results: brand identity, site-level search intent,
  // the priced product (as a web-based game with per-tier offers), and the FAQ
  // (eligible for FAQ rich snippets in Google).
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': `${baseUrl}/#organization`,
        name: 'TwoSoles',
        url: baseUrl,
        logo: `${baseUrl}/favicon/favicon-96x96.png`,
        description: home('metaDescription'),
        contactPoint: {
          '@type': 'ContactPoint',
          email: 'hello@twosoles.live',
          contactType: 'customer support',
          availableLanguage: ['de', 'en'],
        },
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
        '@type': 'SoftwareApplication',
        '@id': `${baseUrl}/#app`,
        name: 'TwoSoles',
        url: baseUrl,
        description: home('metaDescription'),
        applicationCategory: 'GameApplication',
        operatingSystem: 'Web',
        inLanguage: locale,
        publisher: {'@id': `${baseUrl}/#organization`},
        offers: {
          '@type': 'AggregateOffer',
          priceCurrency: currency,
          lowPrice: '0.00',
          highPrice: (highPriceCents / 100).toFixed(2),
          offerCount: offers.length,
          offers,
        },
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
