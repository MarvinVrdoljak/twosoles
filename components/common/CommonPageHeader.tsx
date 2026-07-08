import type {ReactNode} from 'react'
import styles from './CommonPageHeader.module.css'

type CommonPageHeaderProps = {
  title: string
  subtitle: string
  // Optional control rendered inline next to the title (e.g. a "+" action).
  action?: ReactNode
}

// Page intro (title + subtitle) shown at the top of dashboard pages.
export function CommonPageHeader({title, subtitle, action}: CommonPageHeaderProps) {
  return (
    <div className={styles.header}>
      <div className={styles.titleRow}>
        <h1 className={styles.title}>{title}</h1>
        {action}
      </div>
      <p className={styles.subtitle}>{subtitle}</p>
    </div>
  )
}
