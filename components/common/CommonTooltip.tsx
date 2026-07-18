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

// Keep in sync with .tooltip max-width in the CSS module.
const TOOLTIP_MAX = 240

// Hover/focus tooltip that flips its horizontal alignment to stay on screen:
// below + left-aligned by default, right-aligned when it would overflow the
// right viewport edge. Measured on show, so no layout library is needed.
export function CommonTooltip({label, children, icon = false, className}: CommonTooltipProps) {
  const ref = useRef<HTMLSpanElement>(null)
  const [alignRight, setAlignRight] = useState(false)

  // Default: the tooltip extends right from the trigger's left edge. If that
  // would run past the right viewport edge, right-align it instead (extend left
  // from the trigger's right edge). Runs on show, before the fade-in.
  const measure = () => {
    const el = ref.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const margin = 8
    setAlignRight(rect.left + TOOLTIP_MAX + margin > window.innerWidth)
  }

  return (
    <span
      ref={ref}
      className={`${styles.wrap} ${className ?? ''}`}
      tabIndex={0}
      aria-label={label}
      onMouseEnter={measure}
      onFocus={measure}
    >
      {icon ? <Info size={15} className={styles.icon} aria-hidden="true" /> : children}
      <span className={`${styles.tooltip} ${alignRight ? styles.right : ''}`} role="tooltip">
        {label}
      </span>
    </span>
  )
}
