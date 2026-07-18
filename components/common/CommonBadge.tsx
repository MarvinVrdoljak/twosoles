import type {ReactNode} from 'react'
import {CommonTooltip} from './CommonTooltip'
import styles from './CommonBadge.module.css'

// Colour intent of the badge — each maps to a text colour + tinted background.
export type CommonBadgeVariant = 'primary' | 'success' | 'neutral' | 'danger'

type CommonBadgeProps = {
  children: ReactNode
  variant?: CommonBadgeVariant
  // When true, the leading dot pulses to signal a live/active state.
  pulse?: boolean
  // Optional explanatory text shown as a hover/focus tooltip on the badge (e.g.
  // "what does this status mean"). Pure CSS, so it works in server components.
  tooltip?: string
}

// Small pill-shaped status label with a leading dot. The dot can pulse (e.g. for
// a "live" event) via the `pulse` prop. Presentational only — callers own the
// label text and pick the variant.
export function CommonBadge({children, variant = 'neutral', pulse = false, tooltip}: CommonBadgeProps) {
  const badge = (
    <span className={`${styles.badge} ${styles[variant]}`}>
      <span
        className={`${styles.dot} ${pulse ? styles.dotPulse : ''}`}
        aria-hidden="true"
      />
      {children}
    </span>
  )

  if (!tooltip) return badge

  return <CommonTooltip label={tooltip}>{badge}</CommonTooltip>
}
