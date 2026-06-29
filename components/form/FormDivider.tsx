import styles from './FormDivider.module.css'

// Labelled horizontal rule, e.g. "— oder —" between social and email sign-in.
export function FormDivider({label}: {label: string}) {
  return (
    <div className={styles.root}>
      <span className={styles.line} />
      <span className={styles.label}>{label}</span>
      <span className={styles.line} />
    </div>
  )
}
