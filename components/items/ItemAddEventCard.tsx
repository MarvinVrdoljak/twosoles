import {Plus} from 'lucide-react'
import {Link} from '@/i18n/navigation'
import styles from './ItemAddEventCard.module.css'

type ItemAddEventCardProps = {
  href: string
  title: string
  subtitle: string
}

// Dashed "create a new event" call-to-action card on the dashboard.
export function ItemAddEventCard({href, title, subtitle}: ItemAddEventCardProps) {
  return (
    <Link href={href} className={styles.root}>
      <span className={styles.dot}>
        <Plus size={24} aria-hidden="true" />
      </span>
      <span className={styles.body}>
        <span className={styles.title}>{title}</span>
        <span className={styles.subtitle}>{subtitle}</span>
      </span>
    </Link>
  )
}
