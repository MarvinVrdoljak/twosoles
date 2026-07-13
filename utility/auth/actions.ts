'use server'

import {getLocale} from 'next-intl/server'
import {redirect} from 'next/navigation'
import {getPathname} from '@/i18n/navigation'
import {createClient} from '@/utility/supabase/server'
import {createServiceClient} from '@/utility/supabase/service'
import {getUser} from '@/utility/supabase/user'

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
  redirect(getPathname({href: '/dashboard/account', locale}))
}

// Permanently deletes the signed-in user's account. Events and payment history
// cascade off the auth-user delete (both FKs are `on delete cascade`); the couple
// photos in storage are not cascaded, so we remove them first (best-effort). Uses
// the service client because deleting an auth user requires the admin API.
// Returns an error object on failure; on success it clears the session and
// redirects to the localized home page.
export async function deleteAccountAction(): Promise<{error: string} | void> {
  const user = await getUser()
  if (!user) {
    const locale = await getLocale()
    redirect(getPathname({href: '/login', locale}))
  }

  const service = createServiceClient()

  // Best-effort storage cleanup: collect the stored photo paths, then remove them.
  const {data: events} = await service
    .from('events')
    .select('person1_photo, person2_photo')
    .eq('user_id', user.id)
  const rows = (events ?? []) as {person1_photo: string | null; person2_photo: string | null}[]
  const paths = rows
    .flatMap((row) => [row.person1_photo, row.person2_photo])
    .filter((path): path is string => typeof path === 'string' && path.length > 0)
  if (paths.length > 0) {
    await service.storage.from('event-photos').remove(paths)
  }

  // Delete the auth user — events + event_payments cascade via their FKs.
  const {error} = await service.auth.admin.deleteUser(user.id)
  if (error) {
    return {error: error.message}
  }

  // The session cookies are now invalid; clear them before leaving.
  const supabase = await createClient()
  await supabase.auth.signOut()

  const locale = await getLocale()
  redirect(getPathname({href: '/', locale}))
}
