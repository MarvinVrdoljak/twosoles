import {getTranslations, setRequestLocale} from 'next-intl/server'
import {redirect} from 'next/navigation'
import {FormLogin} from '@/components/form/FormLogin'
import {LayoutAuth} from '@/components/layout/LayoutAuth'
import {getPathname} from '@/i18n/navigation'
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
    redirect(getPathname({href: '/dashboard', locale}))
  }

  const {error} = await searchParams
  const t = await getTranslations('auth')

  const errorMessage =
    error === 'link' ? t('linkInvalid') : error === 'oauth' ? t('oauthError') : undefined

  return (
    <LayoutAuth
      eyebrow={t('loginTitle')}
      title={t('loginHeading')}
      subtitle={t('loginSubtitle')}
      error={errorMessage}
      toggle={{text: t('noAccount'), linkLabel: t('toRegister'), href: '/register'}}
    >
      <FormLogin />
    </LayoutAuth>
  )
}
