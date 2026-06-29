'use client'

import {useState} from 'react'
import {useTranslations} from 'next-intl'
import {createClient} from '@/utility/supabase/client'

type Status = 'idle' | 'pending' | 'sent' | 'error'

// Passwordless registration: creates the account (storing the name in user
// metadata) and sends a confirmation magic link.
export function FormRegister() {
  const t = useTranslations('auth')
  const [name, setName] = useState('')
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
      options: {shouldCreateUser: true, data: {name}},
    })

    if (authError) {
      setStatus('error')
      setError(authError.message)
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
        <label htmlFor="name">{t('nameLabel')}</label>
        <input
          id="name"
          name="name"
          type="text"
          autoComplete="name"
          required
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
      </div>

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
        {status === 'pending' ? t('pending') : t('sendRegisterLink')}
      </button>
    </form>
  )
}
