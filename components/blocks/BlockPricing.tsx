import {getLocale, getTranslations} from 'next-intl/server'
import {CommonReveal} from '@/components/common/CommonReveal'
import {ItemPrice} from '@/components/items/ItemPrice'
import {getTierPriceDisplays} from '@/utility/stripe/prices'
import styles from './BlockPricing.module.css'

type PriceTier = {
  name: string
  tagline: string
  capacity: string
  free?: boolean
}

// "Wie viele Gäste kommen?" — capacity-based one-off pricing tiers.
// In-page anchor target for the nav ("Preise"). Prices are read live from
// Stripe (never hardcoded); the free tier shows the localized `freePrice`.
export async function BlockPricing() {
  const t = await getTranslations('pricing')
  const locale = await getLocale()
  const tiers = t.raw('tiers') as PriceTier[]
  const prices = await getTierPriceDisplays(locale, t('freePrice'))

  return (
    <section id="pricing" className={styles.root} aria-labelledby="pricing-title">
      <CommonReveal className={styles.header}>
        <p className="eyebrow">{t('eyebrow')}</p>
        <h2 id="pricing-title" className={styles.title}>
          {t.rich('title', {
            accent: (chunks) => <em className={styles.accent}>{chunks}</em>,
          })}
        </h2>
        <p className={styles.lead}>{t('lead')}</p>
      </CommonReveal>

      <CommonReveal tag="ul" className={styles.grid} delay={0.1}>
        {tiers.map((tier, index) => (
          <ItemPrice
            key={tier.name}
            name={tier.name}
            tagline={tier.tagline}
            price={prices[index]}
            period={tier.free ? undefined : t('perEvent')}
            capacityPrefix={t('capacityPrefix')}
            capacity={tier.capacity}
            ctaLabel={t('cta')}
          />
        ))}
      </CommonReveal>
    </section>
  )
}
