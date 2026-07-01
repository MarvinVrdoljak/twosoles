import React from 'react'
import {Link} from '@/i18n/navigation'
import styles from './CommonButton.module.css'

type CommonButtonProps = {
  children: React.ReactNode
  variant?: 'primary' | 'secondary' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  fullWidth?: boolean
  // Link mode: internal routes (starting with "/") use the locale-aware Link,
  // in-page (#) or external links use a plain anchor.
  href?: string
  // Button mode (when no href): native button for forms / handlers.
  type?: 'button' | 'submit'
  disabled?: boolean
  onClick?: () => void
}

// Pill-shaped action used across the app. Renders a link when `href` is given,
// otherwise a native button.
export function CommonButton({
  children,
  variant = 'primary',
  size = 'lg',
  fullWidth = false,
  href,
  type = 'button',
  disabled,
  onClick,
}: CommonButtonProps) {
  const className = `${styles.root} ${styles[variant]} ${styles[size]}${
    fullWidth ? ` ${styles.fullWidth}` : ''
  }`

  if (href) {
    if (href.startsWith('/')) {
      return (
        <Link href={href} className={className}>
          {children}
        </Link>
      )
    }
    return (
      <a href={href} className={className}>
        {children}
      </a>
    )
  }

  return (
    <button type={type} className={className} disabled={disabled} onClick={onClick}>
      {children}
    </button>
  )
}
