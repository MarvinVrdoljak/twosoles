import {getTranslations, setRequestLocale} from 'next-intl/server'
import {redirect} from 'next/navigation'
import {Link, getPathname} from '@/i18n/navigation'
import type {Locale} from '@/i18n/routing'
import {getUser} from '@/utility/supabase/user'

type HomeProps = {
  params: Promise<{locale: Locale}>
}

// Public landing page — only for visitors who are NOT signed in. Authenticated
// users are sent straight to the host area.
export default async function Home({params}: HomeProps) {
  const {locale} = await params
  setRequestLocale(locale)

  const user = await getUser()
  if (user) {
    redirect(getPathname({href: '/host', locale}))
  }

  const t = await getTranslations('home')

  return (
    <main>
      <h1>{t('title')}</h1>
      <p>{t('intro')}</p>
      <p>
        <Link href="/login">{t('goToLogin')}</Link>
        {' · '}
        <Link href="/register">{t('goToRegister')}</Link>
      </p>
    </main>
  )
}
