'use client'

import {useLocale, useTranslations} from 'next-intl'
import {CommonButton} from '@/components/common/CommonButton'
import type {Locale} from '@/i18n/routing'
import type {EventDraft} from './eventDraft'
import styles from './FormEventSteps.module.css'

type Props = {
  draft: EventDraft
  notice: string | null
  creating: boolean
  // Hidden when the free package is already selected — the main CTA creates it.
  showFreeCard: boolean
  onFree: () => void
}

type Occasion = {value: string; label: string}
type Tier = {name: string; capacity: string}

export function FormEventSummary({draft, notice, creating, showFreeCard, onFree}: Props) {
  const t = useTranslations('eventWizard')
  const tNav = useTranslations('nav')
  const locale = useLocale()

  const notSet = t('summary.notSet')

  const occasions = t.raw('details.occasions') as Occasion[]
  const occasionLabel = occasions.find((o) => o.value === draft.occasion)?.label ?? notSet

  const tiers = useTranslations('pricing').raw('tiers') as Tier[]
  const tier = tiers[draft.packageIndex]

  const couple =
    draft.name1 || draft.name2 ? `${draft.name1 || '?'} & ${draft.name2 || '?'}` : notSet

  const dateLabel = draft.date ? new Date(draft.date).toLocaleDateString(locale) : notSet

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
  ]

  return (
    <div className={styles.summary}>
      <div className={styles.stepCard}>
        <dl className={styles.sumList}>
          {rows.map((row) => (
            <div key={row.label} className={styles.sumRow}>
              <dt className={styles.sumLabel}>{row.label}</dt>
              <dd className={styles.sumValue}>{row.value}</dd>
            </div>
          ))}
        </dl>
      </div>

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

      {notice ? (
        <p className={styles.notice} role="status">
          {notice}
        </p>
      ) : null}
    </div>
  )
}
