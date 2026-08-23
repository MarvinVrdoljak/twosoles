'use client'

import {useTranslations} from 'next-intl'
import {Check} from 'lucide-react'
import type {EventDraft} from './eventDraft'
import styles from './FormEventSteps.module.css'

type Props = {
  draft: EventDraft
  update: (patch: Partial<EventDraft>) => void
  // Display prices from Stripe, index-aligned with the tier list.
  prices: string[]
}

type Tier = {
  name: string
  tagline: string
  capacity: string
  free?: boolean
}

export function FormEventPackage({draft, update, prices}: Props) {
  const t = useTranslations('eventWizard')
  const tPricing = useTranslations('pricing')
  const tiers = tPricing.raw('tiers') as Tier[]

  return (
    <div className={styles.stepCard}>
      <ul className={styles.packages}>
        {tiers.map((tier, index) => {
          const selected = draft.packageIndex === index
          return (
            <li key={tier.name}>
              <button
                type="button"
                className={`${styles.pkgRow} ${selected ? styles.pkgSelected : ''}`}
                onClick={() => update({packageIndex: index})}
                aria-pressed={selected}
              >
                <span className={styles.pkgInfo}>
                  <span className={styles.pkgName}>
                    {tier.name}
                    <span className={styles.pkgPrice}> • {prices[index]}</span>
                  </span>
                  <span className={styles.pkgMeta}>
                    {t('package.upTo', {capacity: tier.capacity})} · {tier.tagline}
                  </span>
                </span>
                {selected ? (
                  <span className={styles.pkgSelectedTag}>
                    <Check size={16} aria-hidden="true" />
                    {t('package.selected')}
                  </span>
                ) : (
                  <span className={styles.pkgAction}>{t('package.select')}</span>
                )}
              </button>
            </li>
          )
        })}
      </ul>

      {/* PAngV: the VAT statement has to sit with the prices, not only in the
          T&Cs. One sentence for the whole list, since it applies to every tier. */}
      <p className={styles.pkgVat}>{t('package.vatNote')}</p>
    </div>
  )
}
