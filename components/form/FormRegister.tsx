'use client'

import {useState} from 'react'
import {useTranslations} from 'next-intl'
import {MailCheck} from 'lucide-react'
import {CommonButton} from '@/components/common/CommonButton'
import {FormField} from '@/components/form/FormField'
import {createClient} from '@/utility/supabase/client'
import styles from './FormRegister.module.css'

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
    return (
      <div className={styles.sent} role="status">
        <MailCheck className={styles.sentIcon} size={32} aria-hidden="true" />
        <p className={styles.sentText}>{t('linkSent', {email})}</p>
      </div>
    )
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <FormField
        id="name"
        label={t('nameLabel')}
        type="text"
        autoComplete="name"
        required
        value={name}
        onChange={setName}
      />
      <FormField
        id="email"
        label={t('emailLabel')}
        type="email"
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

      <CommonButton type="submit" variant="primary" size="lg" fullWidth disabled={status === 'pending'}>
        {status === 'pending' ? t('pending') : t('sendRegisterLink')}
      </CommonButton>
    </form>
  )
}
