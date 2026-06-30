'use client'

import {useState} from 'react'
import {useTranslations} from 'next-intl'
import {CommonButton} from '@/components/common/CommonButton'
import {createClient} from '@/utility/supabase/client'
import styles from './FormGoogleButton.module.css'

// Starts the Google OAuth flow. Supabase redirects to Google and back to
// /auth/callback, which exchanges the code for a session.
export function FormGoogleButton() {
  const t = useTranslations('auth')
  const [pending, setPending] = useState(false)

  async function handleGoogle() {
    setPending(true)
    const supabase = createClient()
    const {error} = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    // On success the browser is redirected to Google, so we only reset on error.
    if (error) {
      setPending(false)
    }
  }

  return (
    <CommonButton
      type="button"
      variant="secondary"
      size="md"
      fullWidth
      disabled={pending}
      onClick={handleGoogle}
    >
      <img className={styles.icon} src="/images/google.svg" alt="" width={20} height={20} />
      {t('continueWithGoogle')}
    </CommonButton>
  )
}
