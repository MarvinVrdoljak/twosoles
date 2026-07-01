import {setRequestLocale} from 'next-intl/server'
import {redirect} from 'next/navigation'
import {FormEventWizard} from '@/components/form/FormEventWizard'
import {getPathname} from '@/i18n/navigation'
import type {Locale} from '@/i18n/routing'
import {getUser} from '@/utility/supabase/user'

type CreateEventPageProps = {
  params: Promise<{locale: Locale}>
}

// Event-creation wizard. Signed-in only — anonymous visitors go to /login.
export default async function CreateEventPage({params}: CreateEventPageProps) {
  const {locale} = await params
  setRequestLocale(locale)

  const user = await getUser()
  if (!user) {
    redirect(getPathname({href: '/login', locale}))
  }

  return <FormEventWizard userId={user.id} />
}
