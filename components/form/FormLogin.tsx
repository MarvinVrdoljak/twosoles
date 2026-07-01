'use client'

import {useState} from 'react'
import {useTranslations} from 'next-intl'
import {CommonButton} from '@/components/common/CommonButton'
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
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<Status>('idle')
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setStatus('pending')
    setError(null)

    const supabase = createClient()
    const {error: authError} = await supabase.auth.signInWithOtp({
      email,
      options: {shouldCreateUser: false},
    })

    if (authError) {
      setStatus('error')
      setError(authError.code === 'otp_disabled' ? t('noAccountError') : authError.message)
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

        {error ? (
          <p className={styles.error} role="alert">
            {error}
          </p>
        ) : null}

        <CommonButton type="submit" variant="primary" size="md" fullWidth disabled={status === 'pending'}>
          {status === 'pending' ? t('pending') : t('sendLoginLink')}
        </CommonButton>
      </form>

      <FormDivider label={t('or')} />
      <FormGoogleButton />
    </>
  )
}
