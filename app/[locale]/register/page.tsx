import {getTranslations, setRequestLocale} from 'next-intl/server'
import {redirect} from 'next/navigation'
import {FormGoogleButton} from '@/components/form/FormGoogleButton'
import {FormRegister} from '@/components/form/FormRegister'
import {Link, getPathname} from '@/i18n/navigation'
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
    <main>
      <h1>{t('registerTitle')}</h1>

      <FormGoogleButton />

      <FormRegister />

      <p>
        {t('haveAccount')} <Link href="/login">{t('toLogin')}</Link>
      </p>
    </main>
  )
}
