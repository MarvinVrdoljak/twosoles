import {getTranslations} from 'next-intl/server'
import {ItemPrice} from '@/components/items/ItemPrice'
import styles from './BlockPricing.module.css'

type PriceTier = {
  name: string
  tagline: string
  price: string
  capacity: string
  free?: boolean
}

// "Wie viele Gäste kommen?" — capacity-based one-off pricing tiers.
// In-page anchor target for the nav ("Preise").
export async function BlockPricing() {
  const t = await getTranslations('pricing')
  const tiers = t.raw('tiers') as PriceTier[]

  return (
    <section id="pricing" className={styles.root} aria-labelledby="pricing-title">
      <div className={styles.header}>
        <p className="eyebrow">{t('eyebrow')}</p>
        <h2 id="pricing-title" className={styles.title}>
          {t.rich('title', {
            accent: (chunks) => <em className={styles.accent}>{chunks}</em>,
          })}
        </h2>
        <p className={styles.lead}>{t('lead')}</p>
      </div>

      <ul className={styles.grid}>
        {tiers.map((tier) => (
          <ItemPrice
            key={tier.name}
            name={tier.name}
            tagline={tier.tagline}
            price={tier.price}
            period={tier.free ? undefined : t('perEvent')}
            capacityPrefix={t('capacityPrefix')}
            capacity={tier.capacity}
            ctaLabel={t('cta')}
          />
        ))}
      </ul>
    </section>
  )
}
