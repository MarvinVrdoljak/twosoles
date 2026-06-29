'use client'

import {useState} from 'react'
import {useTranslations} from 'next-intl'
import {createClient} from '@/utility/supabase/client'

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
      // `otp_disabled` means no account exists for this email (shouldCreateUser
      // is false on login) — point the user to registration instead of leaking
      // the raw GoTrue message.
      setError(authError.code === 'otp_disabled' ? t('noAccountError') : authError.message)
      return
    }

    setStatus('sent')
  }

  if (status === 'sent') {
    return <p>{t('linkSent', {email})}</p>
  }

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label htmlFor="email">{t('emailLabel')}</label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
      </div>

      {error ? <p role="alert">{error}</p> : null}

      <button type="submit" disabled={status === 'pending'}>
        {status === 'pending' ? t('pending') : t('sendLoginLink')}
      </button>
    </form>
  )
}
