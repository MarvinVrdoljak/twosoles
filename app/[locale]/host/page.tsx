import {getTranslations, setRequestLocale} from 'next-intl/server'
import {redirect} from 'next/navigation'
import {FormLogoutButton} from '@/components/form/FormLogoutButton'
import {getPathname} from '@/i18n/navigation'
import type {Locale} from '@/i18n/routing'
import {getUser} from '@/utility/supabase/user'

type HostPageProps = {
  params: Promise<{locale: Locale}>
}

// Authenticated area. Non-authenticated visitors are sent to /login.
export default async function HostPage({params}: HostPageProps) {
  const {locale} = await params
  setRequestLocale(locale)

  const user = await getUser()
  if (!user) {
    redirect(getPathname({href: '/login', locale}))
  }

  const t = await getTranslations('host')

  const rawName: unknown = user.user_metadata?.name
  const displayName = typeof rawName === 'string' && rawName.length > 0 ? rawName : user.email

  return (
    <main>
      <h1>{t('title')}</h1>
      <p>{t('loggedInAs', {name: displayName ?? ''})}</p>
      <FormLogoutButton />
    </main>
  )
}
