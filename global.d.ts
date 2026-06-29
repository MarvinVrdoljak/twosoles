import {routing} from '@/i18n/routing'
import messages from '@/i18n/messages/en.json'

// Type-safe i18n: augments next-intl so t('…') keys, useLocale() and <Link>
// are checked against the real messages + locales. A typo in a key, or a key
// missing from en.json, becomes a compile error.
declare module 'next-intl' {
  interface AppConfig {
    Locale: (typeof routing.locales)[number]
    Messages: typeof messages
  }
}
