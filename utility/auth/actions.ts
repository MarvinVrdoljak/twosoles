'use server'

import {getLocale} from 'next-intl/server'
import {redirect} from 'next/navigation'
import {getPathname} from '@/i18n/navigation'
import {createClient} from '@/utility/supabase/server'

// Server-side sign-out: clears the session cookies via the server client (the
// reliable way with @supabase/ssr), then redirects to the localized login page.
export async function signOutAction() {
  const supabase = await createClient()
  await supabase.auth.signOut()

  const locale = await getLocale()
  redirect(getPathname({href: '/login', locale}))
}
