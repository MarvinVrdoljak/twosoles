import '@/styles/globals.css'

import type {CSSProperties} from 'react'
import {routing} from '@/i18n/routing'

// Hard fallback for the rare request that never reaches the [locale] segment
// (so there is no i18n context and no root layout to inherit html/body from).
// Normal unknown URLs are handled by the localized [locale]/not-found. Text is
// kept in the default locale and self-contained.
const wrap: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 'var(--spacing-16)',
  minHeight: '100vh',
  padding: 'var(--spacing-24)',
  textAlign: 'center',
  background: 'var(--color-background)',
  color: 'var(--color-text)',
  fontFamily: 'var(--font-body)',
}

const code: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-heading)',
  fontWeight: 700,
  fontSize: 'clamp(72px, 18vw, 140px)',
  lineHeight: 1,
  color: 'var(--color-primary)',
}

const link: CSSProperties = {
  color: 'var(--color-primary)',
  fontWeight: 600,
  textDecoration: 'underline',
  textUnderlineOffset: 3,
}

export default function GlobalNotFound() {
  return (
    <html lang={routing.defaultLocale}>
      <body>
        <main style={wrap}>
          <p style={code}>404</p>
          <h1 style={{margin: 0, fontSize: 24}}>Seite nicht gefunden</h1>
          <p style={{margin: 0, color: 'var(--color-text-muted)'}}>
            Diese Seite existiert nicht.
          </p>
          <a href="/" style={link}>
            Zur Startseite
          </a>
        </main>
      </body>
    </html>
  )
}
