import type {MetadataRoute} from 'next'
import {getBaseUrl} from '@/utility/seo'

// Private and functional areas are blocked from crawling. Auth pages
// (login/register) stay crawlable but carry a `noindex` meta tag, so Google
// can actually see the directive instead of being blocked here.
export default function robots(): MetadataRoute.Robots {
  const baseUrl = getBaseUrl()

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/api/',
        '/auth/',
        '/dashboard',
        '/host/',
        '/guest/',
        '/display/',
        '/en/dashboard',
        '/en/host/',
        '/en/guest/',
        '/en/display/',
      ],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  }
}
