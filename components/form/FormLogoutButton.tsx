import {getTranslations} from 'next-intl/server'
import {signOutAction} from '@/utility/auth/actions'

// Server-action logout: no client JS needed. Submitting the form signs the user
// out server-side and redirects to /login.
export async function FormLogoutButton() {
  const t = await getTranslations('host')

  return (
    <form action={signOutAction}>
      <button type="submit">{t('logout')}</button>
    </form>
  )
}
