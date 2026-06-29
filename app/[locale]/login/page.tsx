import {getTranslations, setRequestLocale} from 'next-intl/server'
import {redirect} from 'next/navigation'
import {FormDivider} from '@/components/form/FormDivider'
import {FormGoogleButton} from '@/components/form/FormGoogleButton'
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
    redirect(getPathname({href: '/host', locale}))
  }

  const {error} = await searchParams
  const t = await getTranslations('auth')

  const errorMessage =
    error === 'link' ? t('linkInvalid') : error === 'oauth' ? t('oauthError') : undefined

  return (
    <LayoutAuth
      title={t('loginTitle')}
      subtitle={t('loginSubtitle')}
      error={errorMessage}
      footer={{text: t('noAccount'), linkLabel: t('toRegister'), href: '/register'}}
    >
      <FormGoogleButton />
      <FormDivider label={t('or')} />
      <FormLogin />
    </LayoutAuth>
  )
}
