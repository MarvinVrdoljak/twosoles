import {Download} from 'lucide-react'
import {CommonButton} from '@/components/common/CommonButton'
import styles from './ItemBill.module.css'

type ItemBillProps = {
  title: string
  meta: string
  price: string
  downloadLabel: string
}

// A single invoice row. Static placeholder for now — wired to Stripe later.
export function ItemBill({title, meta, price, downloadLabel}: ItemBillProps) {
  return (
    <div className={styles.root}>
      <div className={styles.info}>
        <p className={styles.title}>{title}</p>
        <p className={styles.meta}>{meta}</p>
      </div>
      <p className={styles.price}>{price}</p>
      <CommonButton variant="primary" size="sm" type="button">
        <Download size={16} aria-hidden="true" />
        {downloadLabel}
      </CommonButton>
    </div>
  )
}
