'use client'

import {type ReactNode, useRef, useState} from 'react'
import {Info} from 'lucide-react'
import styles from './CommonTooltip.module.css'

type CommonTooltipProps = {
  // The tooltip text.
  label: string
  // The trigger element(s). Ignored when `icon` is set.
  children?: ReactNode
  // Render the standard muted info glyph as the trigger (for form-field hints).
  icon?: boolean
  // Extra class on the wrapper (e.g. to control inline sizing at the call site).
  className?: string
}

// Hover/focus tooltip positioned below the trigger. Default: centered under the
// trigger. If a centered box would run off either viewport edge, it's clamped to
// stay on screen (shifting left or right just enough) — so it never overflows,
// even on narrow screens where neither a purely left- nor right-anchored box
// would fit. Measured on show, so no layout library is needed.
export function CommonTooltip({label, children, icon = false, className}: CommonTooltipProps) {
  const wrapRef = useRef<HTMLSpanElement>(null)
  const tipRef = useRef<HTMLSpanElement>(null)
  const [left, setLeft] = useState<number>()

  // Center the tooltip under the trigger, then clamp its viewport position
  // between the two screen margins. `left` ends up as a pixel offset relative to
  // the wrapper. Runs on show, before the fade-in.
  const measure = () => {
    const wrap = wrapRef.current
    const tip = tipRef.current
    if (!wrap || !tip) return
    const wrapRect = wrap.getBoundingClientRect()
    const tipWidth = tip.offsetWidth
    const margin = 8
    const centered = wrapRect.left + wrapRect.width / 2 - tipWidth / 2
    // Clamp so [left, left + tipWidth] stays within the viewport margins. The
    // CSS max-width caps tipWidth to the viewport minus margins, so this range
    // is always valid.
    const clamped = Math.min(Math.max(centered, margin), window.innerWidth - margin - tipWidth)
    setLeft(clamped - wrapRect.left)
  }

  return (
    <span
      ref={wrapRef}
      className={`${styles.wrap} ${className ?? ''}`}
      tabIndex={0}
      aria-label={label}
      onMouseEnter={measure}
      onFocus={measure}
    >
      {icon ? <Info size={15} className={styles.icon} aria-hidden="true" /> : children}
      <span
        ref={tipRef}
        className={styles.tooltip}
        role="tooltip"
        style={left === undefined ? undefined : {left}}
      >
        {label}
      </span>
    </span>
  )
}
