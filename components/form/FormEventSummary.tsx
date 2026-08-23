'use client'

import {useLocale, useTranslations} from 'next-intl'
import {CommonButton} from '@/components/common/CommonButton'
import {Link} from '@/i18n/navigation'
import type {Locale} from '@/i18n/routing'
import type {EventDraft} from './eventDraft'
import styles from './FormEventSteps.module.css'

type Props = {
  draft: EventDraft
  creating: boolean
  // Hidden when the free package is already selected — the main CTA creates it.
  showFreeCard: boolean
  onFree: () => void
  // Display price of the selected tier, formatted by Stripe's currency.
  price: string
}

type Occasion = {value: string; label: string}
type Tier = {name: string; capacity: string}

export function FormEventSummary({
  draft,
  creating,
  showFreeCard,
  onFree,
  price,
}: Props) {
  const t = useTranslations('eventWizard')
  const tNav = useTranslations('nav')
  const tCheckout = useTranslations('checkout')
  const locale = useLocale()

  const notSet = t('summary.notSet')

  const occasions = t.raw('details.occasions') as Occasion[]
  const occasionLabel = occasions.find((o) => o.value === draft.occasion)?.label ?? notSet

  const tiers = useTranslations('pricing').raw('tiers') as Tier[]
  const tier = tiers[draft.packageIndex]

  // The free card is only offered when a PAID tier is selected, so it doubles as
  // "this order costs money" — which is exactly when the § 312j box is required.
  const isPaid = showFreeCard

  const couple =
    draft.name1 || draft.name2 ? `${draft.name1 || '?'} & ${draft.name2 || '?'}` : notSet

  const dateLabel = draft.date ? new Date(draft.date).toLocaleDateString(locale) : notSet

  // One overview, not two: the event details and the order details a paid
  // booking has to show under § 312j Abs. 2 BGB (essential features, contract
  // duration, total price) live in the same list.
  const rows = [
    {label: t('summary.couple'), value: couple},
    {label: t('summary.occasion'), value: occasionLabel},
    {label: t('summary.date'), value: dateLabel},
    {label: t('summary.language'), value: tNav(`languageNames.${draft.language as Locale}`)},
    {label: t('summary.questions'), value: String(draft.questions.length)},
    {
      label: t('summary.package'),
      value: tier
        ? t('summary.packageValue', {name: tier.name, capacity: tier.capacity})
        : notSet,
    },
    ...(isPaid
      ? [
          {label: tCheckout('service'), value: tCheckout('serviceValue')},
          {label: tCheckout('period'), value: tCheckout('periodValue')},
        ]
      : []),
  ]

  return (
    <div className={styles.summary}>
      <div className={`${styles.stepCard} ${isPaid ? styles.orderCard : ''}`}>
        <dl className={styles.sumList}>
          {rows.map((row) => (
            <div key={row.label} className={styles.sumRow}>
              <dt className={styles.sumLabel}>{row.label}</dt>
              <dd className={styles.sumValue}>{row.value}</dd>
            </div>
          ))}

          {/* The total closes the list, directly above the order button. The VAT
              note sits inside the same cell so it stays glued to the amount
              (PAngV wants it right at the price, not floating below the card). */}
          {isPaid ? (
            <div className={`${styles.sumRow} ${styles.orderTotalRow}`}>
              <dt className={styles.sumLabel}>{tCheckout('total')}</dt>
              <dd className={`${styles.sumValue} ${styles.orderTotal}`}>
                {price}
                <span className={styles.orderVat}>{tCheckout('vatNote')}</span>
              </dd>
            </div>
          ) : null}
        </dl>

        {isPaid ? (
          <>
            <p className={styles.legalHint}>
              {tCheckout.rich('legalHint', {
                terms: (chunks) => (
                  <Link href="/terms" className={styles.legalLink} target="_blank">
                    {chunks}
                  </Link>
                ),
                privacy: (chunks) => (
                  <Link href="/privacy" className={styles.legalLink} target="_blank">
                    {chunks}
                  </Link>
                ),
              })}
            </p>
          </>
        ) : null}
      </div>

      {/* The free alternative sits last: it is a way out of the paid order, not
          part of it, so it must not push the order details away from the CTA. */}
      {showFreeCard ? (
        <div className={styles.stepCard}>
          <div className={styles.freeBlock}>
            <h2 className={styles.freeTitle}>{t('summary.freeTitle')}</h2>
            <p className={styles.freeText}>{t('summary.freeText')}</p>
            <CommonButton variant="secondary" size="md" onClick={onFree} disabled={creating}>
              {creating ? t('summary.creatingFree') : t('summary.freeButton')}
            </CommonButton>
          </div>
        </div>
      ) : null}
    </div>
  )
}
