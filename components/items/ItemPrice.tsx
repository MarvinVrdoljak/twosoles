import {CommonButton} from '@/components/common/CommonButton'
import styles from './ItemPrice.module.css'

type ItemPriceProps = {
  name: string
  tagline: string
  price: string
  period?: string
  capacityPrefix: string
  capacity: string
  ctaLabel: string
}

// A single pricing tier card. Rendered inside the BlockPricing list.
export function ItemPrice({
  name,
  tagline,
  price,
  period,
  capacityPrefix,
  capacity,
  ctaLabel,
}: ItemPriceProps) {
  return (
    <li className={styles.root}>
      <div className={styles.head}>
        <h3 className={styles.name}>{name}</h3>
        <p className="eyebrow eyebrowSmall">{tagline}</p>
      </div>

      <div className={styles.body}>
        <p className={styles.price}>
          <span className={styles.amount}>{price}</span>
          {period ? <span className={styles.period}>{period}</span> : null}
        </p>

        <p className={styles.capacity}>
          {capacityPrefix} <strong className={styles.capacityCount}>{capacity}</strong>
        </p>

        <CommonButton href="/register" variant="primary" size="md" fullWidth>
          {ctaLabel}
        </CommonButton>
      </div>
    </li>
  )
}
