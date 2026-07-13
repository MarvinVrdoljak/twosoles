import {ExternalLink} from 'lucide-react'
import {CommonButton} from '@/components/common/CommonButton'
import styles from './ItemBill.module.css'

type ItemBillProps = {
  title: string
  meta: string
  price: string
  receiptLabel: string
  // Stripe-hosted receipt URL; the button only shows when one is available.
  receiptUrl?: string | null
}

// A single purchase row, backed by a real payment. Links out to the Stripe
// receipt when Stripe returns one.
export function ItemBill({title, meta, price, receiptLabel, receiptUrl}: ItemBillProps) {
  return (
    <div className={styles.root}>
      <div className={styles.info}>
        <p className={styles.title}>{title}</p>
        <p className={styles.meta}>{meta}</p>
      </div>
      <p className={styles.price}>{price}</p>
      {receiptUrl ? (
        <CommonButton variant="primary" size="sm" href={receiptUrl} target="_blank">
          <ExternalLink size={16} aria-hidden="true" />
          {receiptLabel}
        </CommonButton>
      ) : null}
    </div>
  )
}
