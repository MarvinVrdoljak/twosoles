import styles from './ItemStep.module.css'

type ItemStepProps = {
  number: number
  label: string
  title: string
  description: string
}

// A single numbered step teaser. Rendered inside the BlockSteps ordered list.
// The number dot is decorative (the <ol> already conveys order to AT).
export function ItemStep({number, label, title, description}: ItemStepProps) {
  return (
    <li className={styles.root}>
      <span className={styles.dot} aria-hidden="true">
        {number}
      </span>
      <div className={styles.body}>
        <div className={styles.heading}>
          <p className="eyebrow eyebrowSmall">{label}</p>
          <h3 className={styles.title}>{title}</h3>
        </div>
        <p className={styles.description}>{description}</p>
      </div>
    </li>
  )
}
