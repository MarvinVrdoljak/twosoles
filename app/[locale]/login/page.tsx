import {getTranslations, setRequestLocale} from 'next-intl/server'
import {redirect} from 'next/navigation'
import {FormGoogleButton} from '@/components/form/FormGoogleButton'
import {FormLogin} from '@/components/form/FormLogin'
import {Link, getPathname} from '@/i18n/navigation'
import type {Locale} from '@/i18n/routing'
import {getUser} from '@/utility/supabase/user'

type LoginPageProps = {
  params: Promise<{locale: Locale}>
  searchParams: Promise<{error?: string}>
}

export default async function LoginPage({params, searchParams}: LoginPageProps) {
  const {locale} = await params
  setRequestLocale(locale)

  // Already signed in → no reason to show login.
  if (await getUser()) {
    redirect(getPathname({href: '/host', locale}))
  }

  const {error} = await searchParams
  const t = await getTranslations('auth')

  return (
    <main>
      <h1>{t('loginTitle')}</h1>

      {error === 'link' ? <p role="alert">{t('linkInvalid')}</p> : null}
      {error === 'oauth' ? <p role="alert">{t('oauthError')}</p> : null}

      <FormGoogleButton />

      <FormLogin />

      <p>
        {t('noAccount')} <Link href="/register">{t('toRegister')}</Link>
      </p>
    </main>
  )
}
