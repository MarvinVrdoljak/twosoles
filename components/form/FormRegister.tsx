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
import styles from './FormRegister.module.css'

type Status = 'idle' | 'pending' | 'sent' | 'error'

// Passwordless registration: creates the account (storing the name and the
// chosen UI language in user metadata) and sends a magic link. The stored
// `locale` drives the language of all future auth emails and can later be
// changed from the user's account settings.
export function FormRegister() {
  const t = useTranslations('auth')
  const locale = useLocale()
  const {toast} = useToast()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<Status>('idle')

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setStatus('pending')

    const supabase = createClient()
    const {error: authError} = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true,
        data: {name, locale},
        // Drives the language of the magic-link email and where the link lands
        // (see supabase/templates/magic_link.html). Uses the locale of the page
        // the user is actually on right now, not stored metadata.
        emailRedirectTo: `${window.location.origin}/${locale}`,
      },
    })

    if (authError) {
      setStatus('idle')
      toast(authError.message)
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
          id="name"
          label={t('nameLabel')}
          type="text"
          placeholder={t('namePlaceholder')}
          autoComplete="name"
          required
          value={name}
          onChange={setName}
        />
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
          {status === 'pending' ? t('pending') : t('sendRegisterLink')}
        </CommonButton>
      </form>

      <FormDivider label={t('or')} />
      <FormGoogleButton />
    </>
  )
}
