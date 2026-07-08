'use client'

import {useState, useTransition} from 'react'
import {useRouter} from 'next/navigation'
import {useTranslations} from 'next-intl'
import {Lock} from 'lucide-react'
import {CommonButton} from '@/components/common/CommonButton'
import {verifyHostPinAction} from '@/utility/game/actions'
import styles from './HostPinGate.module.css'

type HostPinGateProps = {
  eventId: string
  coupleName: string
}

// Login-free host access: whoever knows the event's 4-digit PIN may open the
// control panel. On success the server sets the host cookie and we refresh so
// the page re-renders with the actual HostGame.
export function HostPinGate({eventId, coupleName}: HostPinGateProps) {
  const t = useTranslations('game')
  const router = useRouter()
  const [pin, setPin] = useState('')
  const [error, setError] = useState(false)
  const [pending, startTransition] = useTransition()

  const submit = (event: React.FormEvent) => {
    event.preventDefault()
    if (pin.length !== 4 || pending) return
    setError(false)
    startTransition(async () => {
      const {ok} = await verifyHostPinAction(eventId, pin)
      if (ok) {
        router.refresh()
      } else {
        setError(true)
        setPin('')
      }
    })
  }

  return (
    <div className={styles.root}>
      <form className={styles.card} onSubmit={submit}>
        <span className={styles.icon} aria-hidden="true">
          <Lock size={22} />
        </span>
        <h1 className={styles.title}>{t('host.pinTitle')}</h1>
        <p className={styles.couple}>{coupleName}</p>
        <p className={styles.hint}>{t('host.pinHint')}</p>
        <input
          className={styles.input}
          value={pin}
          onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={4}
          aria-label={t('host.pinLabel')}
          aria-invalid={error}
          autoFocus
        />
        {error ? (
          <p className={styles.error} role="alert">
            {t('host.pinError')}
          </p>
        ) : null}
        <CommonButton type="submit" fullWidth disabled={pin.length !== 4 || pending}>
          {pending ? t('host.pinChecking') : t('host.pinSubmit')}
        </CommonButton>
      </form>
    </div>
  )
}
