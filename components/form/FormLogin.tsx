'use client'

import {useState} from 'react'
import {useLocale, useTranslations} from 'next-intl'
import {CommonButton} from '@/components/common/CommonButton'
import {useToast} from '@/components/common/CommonToast'
import {FormAuthSent} from '@/components/form/FormAuthSent'
import {FormDivider} from '@/components/form/FormDivider'
import {FormField} from '@/components/form/FormField'
import {FormGoogleButton} from '@/components/form/FormGoogleButton'
import {createClient} from '@/utility/supabase/client'
import styles from './FormLogin.module.css'

type Status = 'idle' | 'pending' | 'sent' | 'error'

// Passwordless login: sends a magic link to an existing account.
export function FormLogin() {
  const t = useTranslations('auth')
  const locale = useLocale()
  const {toast} = useToast()
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<Status>('idle')

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setStatus('pending')

    const supabase = createClient()
    const {error: authError} = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: false,
        // Language of the magic-link email + where the link lands is derived
        // from this URL's locale (see supabase/templates/magic_link.html), so a
        // login email always matches the page the user is on — `data.locale` is
        // ignored for existing users, which is why we route locale through here.
        emailRedirectTo: `${window.location.origin}/${locale}`,
      },
    })

    if (authError) {
      setStatus('idle')
      toast(authError.code === 'otp_disabled' ? t('noAccountError') : authError.message)
      return
    }

    setStatus('sent')
  }

  if (status === 'sent') {
    return <FormAuthSent text={t('linkSent', {email})} />
  }

  return (
    <>
      <form className={styles.form} onSubmit={handleSubmit}>
        <FormField
          id="email"
          label={t('emailLabel')}
          type="email"
          placeholder={t('emailPlaceholder')}
          autoComplete="email"
          required
          value={email}
          onChange={setEmail}
        />

        <CommonButton type="submit" variant="primary" size="md" fullWidth disabled={status === 'pending'}>
          {status === 'pending' ? t('pending') : t('sendLoginLink')}
        </CommonButton>
      </form>

      <FormDivider label={t('or')} />
      <FormGoogleButton />
    </>
  )
}
