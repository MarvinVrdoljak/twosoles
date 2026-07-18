import type {Metadata} from 'next'
import {getPathname} from '@/i18n/navigation'
import {routing, type Locale} from '@/i18n/routing'

// Absolute site origin. Reused for `metadataBase`, canonical URLs, sitemap,
// robots and OpenGraph tags — same env var the Stripe/display code relies on.
export function getBaseUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3001'
}

// Maps an app locale to the BCP-47 tag OpenGraph expects.
const OG_LOCALE: Record<Locale, string> = {de: 'de_DE', en: 'en_US'}

// Default social share image (1200×630). Relative path — `metadataBase`
// resolves it to an absolute URL for the OG/Twitter tags.
export const SHARE_IMAGE = {
  url: '/images/twosoles-wedding-game-sharing.jpg',
  width: 1200,
  height: 630,
  alt: 'TwoSoles · Das digitale Hochzeits-Schuhspiel',
} as const

// Builds canonical + hreflang alternates for one route across every locale.
// `href` is the internal, locale-agnostic pathname (e.g. '/contact', '/').
// `getPathname` yields the localized URL (de → '/contact', en → '/en/contact'),
// so search engines never treat the two language variants as duplicates.
export function buildAlternates(href: string, locale: Locale): NonNullable<Metadata['alternates']> {
  const baseUrl = getBaseUrl()
  const languages: Record<string, string> = {}

  for (const l of routing.locales) {
    languages[l] = baseUrl + getPathname({href, locale: l})
  }
  // x-default points crawlers at the default-locale URL.
  languages['x-default'] = baseUrl + getPathname({href, locale: routing.defaultLocale})

  return {
    canonical: baseUrl + getPathname({href, locale}),
    languages,
  }
}

type PageMetaInput = {
  locale: Locale
  href: string
  title: string
  description: string
  // The landing page owns its full <title> — bypass the "· TwoSoles" template.
  absoluteTitle?: boolean
}

// Per-page metadata: title (through the layout template unless absolute),
// description, canonical + hreflang, and matching OpenGraph/Twitter cards.
export function pageMetadata({
  locale,
  href,
  title,
  description,
  absoluteTitle = false,
}: PageMetaInput): Metadata {
  const alternates = buildAlternates(href, locale)
  const canonical = getBaseUrl() + getPathname({href, locale})
  const ogTitle = absoluteTitle ? title : `${title} · TwoSoles`

  return {
    title: absoluteTitle ? {absolute: title} : title,
    description,
    alternates,
    openGraph: {
      type: 'website',
      siteName: 'TwoSoles',
      locale: OG_LOCALE[locale],
      // Every other locale, so social platforms know the page exists in more languages.
      alternateLocale: routing.locales.filter((l) => l !== locale).map((l) => OG_LOCALE[l]),
      title: ogTitle,
      description,
      url: canonical,
      images: [SHARE_IMAGE],
    },
    twitter: {
      card: 'summary_large_image',
      title: ogTitle,
      description,
      images: [SHARE_IMAGE.url],
    },
  }
}
