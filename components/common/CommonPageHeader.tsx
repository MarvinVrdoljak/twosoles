import styles from './CommonPageHeader.module.css'

type CommonPageHeaderProps = {
  title: string
  subtitle: string
}

// Page intro (title + subtitle) shown at the top of dashboard pages.
export function CommonPageHeader({title, subtitle}: CommonPageHeaderProps) {
  return (
    <div className={styles.header}>
      <h1 className={styles.title}>{title}</h1>
      <p className={styles.subtitle}>{subtitle}</p>
    </div>
  )
}
