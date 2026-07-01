'use client'

import React, {useEffect} from 'react'
import {createPortal} from 'react-dom'
import {X} from 'lucide-react'
import styles from './CommonModal.module.css'

type CommonModalProps = {
  open: boolean
  onClose: () => void
  title: string
  closeLabel: string
  children: React.ReactNode
  footer?: React.ReactNode
}

// Lightweight centered dialog: dimmed backdrop, closes on backdrop click and
// Escape. Locks body scroll while open.
export function CommonModal({open, onClose, title, closeLabel, children, footer}: CommonModalProps) {
  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = previousOverflow
    }
  }, [open, onClose])

  // Rendered into <body> via a portal so it escapes the wizard's stacking
  // contexts and always sits above the sticky bottom bar.
  if (!open || typeof document === 'undefined') return null

  return createPortal(
    <div className={styles.backdrop} role="presentation" onClick={onClose}>
      <div
        className={styles.panel}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(event) => event.stopPropagation()}
      >
        <div className={styles.header}>
          <h2 className={styles.title}>{title}</h2>
          <button type="button" className={styles.close} onClick={onClose} aria-label={closeLabel}>
            <X size={20} aria-hidden="true" />
          </button>
        </div>
        <div className={styles.body}>{children}</div>
        {footer ? <div className={styles.footer}>{footer}</div> : null}
      </div>
    </div>,
    document.body,
  )
}
