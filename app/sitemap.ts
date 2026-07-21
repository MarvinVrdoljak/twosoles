import type {MetadataRoute} from 'next'
import {getPathname} from '@/i18n/navigation'
import {routing} from '@/i18n/routing'
import {getBaseUrl} from '@/utility/seo'

// Public, indexable routes only. Private/auth/game routes (dashboard, login,
// register, host/guest/display) are intentionally excluded.
const ROUTES = ['/', '/faq', '/contact', '/imprint', '/privacy', '/terms'] as const

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = getBaseUrl()
  const lastModified = new Date()

  return ROUTES.map((href) => {
    const languages: Record<string, string> = {}
    for (const locale of routing.locales) {
      languages[locale] = baseUrl + getPathname({href, locale})
    }

    return {
      url: baseUrl + getPathname({href, locale: routing.defaultLocale}),
      lastModified,
      changeFrequency: href === '/' ? 'weekly' : 'monthly',
      priority: href === '/' ? 1 : href === '/faq' ? 0.8 : 0.6,
      alternates: {languages},
    }
  })
}
