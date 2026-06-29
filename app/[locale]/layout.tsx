import '@/styles/globals.css'

import React from 'react'
import {notFound} from 'next/navigation'
import {NextIntlClientProvider, hasLocale} from 'next-intl'
import {setRequestLocale} from 'next-intl/server'
import {Fraunces, Nunito} from 'next/font/google'
import {routing} from '@/i18n/routing'

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
        <NextIntlClientProvider>{children}</NextIntlClientProvider>
      </body>
    </html>
  )
}
