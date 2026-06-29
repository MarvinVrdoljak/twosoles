import {defineRouting} from 'next-intl/routing'

// Single source of truth for locales. Add a locale here AND add a matching
// messages/<locale>.json file — nothing else needs to change.
export const routing = defineRouting({
  locales: ['de', 'en'],
  defaultLocale: 'de',
  localePrefix: 'as-needed',
})

export type Locale = (typeof routing.locales)[number]
