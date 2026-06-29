import {getTranslations, setRequestLocale} from 'next-intl/server'
import {redirect} from 'next/navigation'
import {FormDivider} from '@/components/form/FormDivider'
import {FormGoogleButton} from '@/components/form/FormGoogleButton'
import {FormRegister} from '@/components/form/FormRegister'
import {LayoutAuth} from '@/components/layout/LayoutAuth'
import {getPathname} from '@/i18n/navigation'
import type {Locale} from '@/i18n/routing'
import {getUser} from '@/utility/supabase/user'

type RegisterPageProps = {
  params: Promise<{locale: Locale}>
}

export default async function RegisterPage({params}: RegisterPageProps) {
  const {locale} = await params
  setRequestLocale(locale)

  // Already signed in → straight to the host area.
  if (await getUser()) {
    redirect(getPathname({href: '/host', locale}))
  }

  const t = await getTranslations('auth')

  return (
    <LayoutAuth
      title={t('registerTitle')}
      subtitle={t('registerSubtitle')}
      footer={{text: t('haveAccount'), linkLabel: t('toLogin'), href: '/login'}}
    >
      <FormGoogleButton />
      <FormDivider label={t('or')} />
      <FormRegister />
    </LayoutAuth>
  )
}
