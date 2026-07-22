import React from 'react'
import {Link} from '@/i18n/navigation'
import styles from './CommonButton.module.css'

type CommonButtonProps = {
  children: React.ReactNode
  variant?: 'primary' | 'secondary' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  fullWidth?: boolean
  // Square, circular button for a single icon (label goes in `aria-label`).
  iconOnly?: boolean
  'aria-label'?: string
  // Link mode: internal routes (starting with "/") use the locale-aware Link,
  // in-page (#) or external links use a plain anchor.
  href?: string
  // Button mode (when no href): native button for forms / handlers.
  type?: 'button' | 'submit'
  disabled?: boolean
  onClick?: (event: React.MouseEvent<HTMLElement>) => void
  // Link mode only: open in a new tab (adds a safe rel).
  target?: '_blank'
}

// Pill-shaped action used across the app. Renders a link when `href` is given,
// otherwise a native button.
export function CommonButton({
  children,
  variant = 'primary',
  size = 'lg',
  fullWidth = false,
  iconOnly = false,
  href,
  type = 'button',
  disabled,
  onClick,
  target,
  'aria-label': ariaLabel,
}: CommonButtonProps) {
  const className = `${styles.root} ${styles[variant]} ${styles[size]}${
    fullWidth ? ` ${styles.fullWidth}` : ''
  }${iconOnly ? ` ${styles.iconOnly}` : ''}`

  const rel = target === '_blank' ? 'noopener noreferrer' : undefined

  if (href) {
    if (href.startsWith('/')) {
      return (
        <Link
          href={href}
          className={className}
          target={target}
          rel={rel}
          onClick={onClick}
          aria-label={ariaLabel}
        >
          {children}
        </Link>
      )
    }
    return (
      <a
        href={href}
        className={className}
        target={target}
        rel={rel}
        onClick={onClick}
        aria-label={ariaLabel}
      >
        {children}
      </a>
    )
  }

  return (
    <button
      type={type}
      className={className}
      disabled={disabled}
      onClick={onClick}
      aria-label={ariaLabel}
    >
      {children}
    </button>
  )
}
