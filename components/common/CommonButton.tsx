import React from 'react'
import styles from './CommonButton.module.css'

interface CommonButtonProps {
  children: React.ReactNode
  disabled?: boolean
  onClick?: () => void
}

// Each element gets its own explicit class — no nested/descendant selectors.
export function CommonButton({children, disabled, onClick}: CommonButtonProps) {
  return (
    <button className={styles.root} disabled={disabled} onClick={onClick}>
      <span className={styles.label}>{children}</span>
    </button>
  )
}
