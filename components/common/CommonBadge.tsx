import type {ReactNode} from 'react'
import styles from './CommonBadge.module.css'

// Colour intent of the badge — each maps to a text colour + tinted background.
export type CommonBadgeVariant = 'primary' | 'success' | 'neutral' | 'danger'

type CommonBadgeProps = {
  children: ReactNode
  variant?: CommonBadgeVariant
  // When true, the leading dot pulses to signal a live/active state.
  pulse?: boolean
}

// Small pill-shaped status label with a leading dot. The dot can pulse (e.g. for
// a "live" event) via the `pulse` prop. Presentational only — callers own the
// label text and pick the variant.
export function CommonBadge({children, variant = 'neutral', pulse = false}: CommonBadgeProps) {
  return (
    <span className={`${styles.badge} ${styles[variant]}`}>
      <span
        className={`${styles.dot} ${pulse ? styles.dotPulse : ''}`}
        aria-hidden="true"
      />
      {children}
    </span>
  )
}
