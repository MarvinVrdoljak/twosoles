'use client'

import {type ReactNode, useEffect, useRef, useState} from 'react'
import {createPortal} from 'react-dom'
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

// Hover/focus tooltip positioned below the trigger. The tooltip box is rendered
// in a body portal with fixed positioning, so it always floats above the rest of
// the page — including custom dropdown menus that are themselves portaled (e.g.
// the color picker) and would otherwise cover an in-flow tooltip. Default:
// centered under the trigger; if a centered box would run off either viewport
// edge, it's clamped to stay on screen. Measured on show, so no layout library
// is needed.
export function CommonTooltip({label, children, icon = false, className}: CommonTooltipProps) {
  const wrapRef = useRef<HTMLSpanElement>(null)
  const tipRef = useRef<HTMLSpanElement>(null)
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState<{top: number; left: number}>()

  const show = () => setOpen(true)
  const hide = () => {
    setOpen(false)
    setPos(undefined)
  }

  // Once the tooltip has mounted (open), measure the trigger and the tooltip and
  // place the box: centered under the trigger, clamped to the viewport margins.
  // Runs after paint so `offsetWidth` is real; until `pos` is set the box stays
  // invisible (opacity 0) and offscreen, so there's no flash before it settles.
  useEffect(() => {
    if (!open) return
    const wrap = wrapRef.current
    const tip = tipRef.current
    if (!wrap || !tip) return
    const rect = wrap.getBoundingClientRect()
    const tipWidth = tip.offsetWidth
    const margin = 8
    const centered = rect.left + rect.width / 2 - tipWidth / 2
    // Clamp so [left, left + tipWidth] stays within the viewport margins. The CSS
    // max-width caps tipWidth to the viewport minus margins, so this is valid.
    const left = Math.min(Math.max(centered, margin), window.innerWidth - margin - tipWidth)
    setPos({top: rect.bottom + margin, left})
  }, [open, label])

  return (
    <span
      ref={wrapRef}
      className={`${styles.wrap} ${className ?? ''}`}
      tabIndex={0}
      aria-label={label}
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
    >
      {icon ? <Info size={15} className={styles.icon} aria-hidden="true" /> : children}
      {open && typeof document !== 'undefined'
        ? createPortal(
            <span
              ref={tipRef}
              className={styles.tooltip}
              role="tooltip"
              style={{
                top: pos?.top ?? -9999,
                left: pos?.left ?? -9999,
                opacity: pos ? 1 : 0,
              }}
            >
              {label}
            </span>,
            document.body
          )
        : null}
    </span>
  )
}
