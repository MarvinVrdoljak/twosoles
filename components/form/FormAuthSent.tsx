import {MailCheck} from 'lucide-react'
import styles from './FormAuthSent.module.css'

type FormAuthSentProps = {
  text: string
}

// Confirmation shown after a magic link has been sent — shared by login and
// registration.
export function FormAuthSent({text}: FormAuthSentProps) {
  return (
    <div className={styles.sent} role="status">
      <MailCheck className={styles.sentIcon} size={32} aria-hidden="true" />
      <p className={styles.sentText}>{text}</p>
    </div>
  )
}
