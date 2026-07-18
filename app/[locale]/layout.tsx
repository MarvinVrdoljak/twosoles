import '@/styles/globals.css'

import React from 'react'
import type {Metadata, Viewport} from 'next'
import {Analytics} from '@vercel/analytics/next'
import {SpeedInsights} from '@vercel/speed-insights/next'
import {notFound} from 'next/navigation'
import {NextIntlClientProvider, hasLocale} from 'next-intl'
import {setRequestLocale} from 'next-intl/server'
import {Fraunces, Nunito} from 'next/font/google'
import {ToastProvider} from '@/components/common/CommonToast'
import {routing} from '@/i18n/routing'
import {getBaseUrl, SHARE_IMAGE} from '@/utility/seo'

// Site-wide defaults. Page-level `generateMetadata` overrides title/description
// via the `%s` template and adds canonical + hreflang; favicons + manifest live
// in /public/favicon. `metadataBase` makes every relative OG/canonical URL absolute.
export const metadata: Metadata = {
  metadataBase: new URL(getBaseUrl()),
  title: {default: 'TwoSoles · Das digitale Hochzeits-Schuhspiel', template: '%s · TwoSoles'},
  description:
    'TwoSoles ist das digitale Wedding Shoe Game: Der ganze Saal stimmt per Handy ab, der Beamer enthüllt das Ergebnis. Ohne App, ohne Login — in fünf Minuten startklar.',
  applicationName: 'TwoSoles',
  robots: {index: true, follow: true},
  formatDetection: {telephone: false, email: false, address: false},
  openGraph: {
    type: 'website',
    siteName: 'TwoSoles',
    title: 'TwoSoles · Das digitale Hochzeits-Schuhspiel',
    description:
      'Das Wedding Shoe Game — live mit allen Gästen. Ohne App, ohne Login, in fünf Minuten startklar.',
    images: [SHARE_IMAGE],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TwoSoles · Das digitale Hochzeits-Schuhspiel',
    description:
      'Das Wedding Shoe Game — live mit allen Gästen. Ohne App, ohne Login, in fünf Minuten startklar.',
    images: [SHARE_IMAGE.url],
  },
  icons: {
    icon: [
      {url: '/favicon/favicon.ico', sizes: 'any'},
      {url: '/favicon/favicon.svg', type: 'image/svg+xml'},
      {url: '/favicon/favicon-96x96.png', type: 'image/png', sizes: '96x96'},
    ],
    shortcut: ['/favicon/favicon.ico'],
    apple: [{url: '/favicon/apple-touch-icon.png', sizes: '180x180'}],
  },
  manifest: '/favicon/site.webmanifest',
}

// The public site always renders in the light brand theme (only the live game
// screens flip to dark), so a single theme-color for the mobile browser chrome.
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#faf7f2',
}

// Self-hosted Google fonts exposed as CSS variables consumed by tokens.css.
// Nunito = body (--font-sans), Fraunces = headlines (--font-display).
const nunito = Nunito({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-sans',
})

const fraunces = Fraunces({
  subsets: ['latin'],
  display: 'swap',
  style: ['normal', 'italic'],
  axes: ['SOFT', 'WONK', 'opsz'],
  variable: '--font-display',
})

// Statically generate a layout per locale.
export function generateStaticParams() {
  return routing.locales.map((locale) => ({locale}))
}

type LocaleLayoutProps = {
  children: React.ReactNode
  params: Promise<{locale: string}>
}

export default async function LocaleLayout({children, params}: LocaleLayoutProps) {
  const {locale} = await params

  if (!hasLocale(routing.locales, locale)) {
    notFound()
  }

  // Enables static rendering for this locale.
  setRequestLocale(locale)

  return (
    <html lang={locale} className={`${nunito.variable} ${fraunces.variable}`}>
      <body>
        <NextIntlClientProvider>
          <ToastProvider>{children}</ToastProvider>
        </NextIntlClientProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
