import {getTranslations, setRequestLocale} from 'next-intl/server'
import {redirect} from 'next/navigation'
import {FormRegister} from '@/components/form/FormRegister'
import {LayoutAuth} from '@/components/layout/LayoutAuth'
import {getPathname} from '@/i18n/navigation'
import type {Locale} from '@/i18n/routing'
import {getUser} from '@/utility/supabase/user'

type RegisterPageProps = {
  params: Promise<{locale: Locale}>
}

// Auth entry point — no SEO value, keep it out of the index.
export const metadata = {robots: {index: false, follow: false}}

export default async function RegisterPage({params}: RegisterPageProps) {
  const {locale} = await params
  setRequestLocale(locale)

  // Already signed in → straight to the host area.
  if (await getUser()) {
    redirect(getPathname({href: '/dashboard', locale}))
  }

  const t = await getTranslations('auth')

  return (
    <LayoutAuth
      eyebrow={t('registerTitle')}
      title={t('registerHeading')}
      subtitle={t('registerSubtitle')}
      toggle={{text: t('haveAccount'), linkLabel: t('toLogin'), href: '/login'}}
    >
      <FormRegister />
    </LayoutAuth>
  )
}
