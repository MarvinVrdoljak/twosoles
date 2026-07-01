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

// Server-side profile update. Doing this on the server (not the browser client)
// keeps the SSR session intact — a client-side updateUser races the middleware's
// token refresh and can log the user out. Persists the name to the user metadata
// (merges, so the registration email locale is preserved), then redirects back
// to the account page. Language is a plain UI switch, not a stored preference.
export async function updateProfileAction(name: string) {
  const supabase = await createClient()
  const {error} = await supabase.auth.updateUser({data: {name}})

  if (error) {
    return {error: error.message}
  }

  const locale = await getLocale()
  redirect(getPathname({href: '/host/account', locale}))
}
