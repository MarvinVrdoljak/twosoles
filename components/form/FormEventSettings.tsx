'use client'

import {useTranslations} from 'next-intl'
import {RotateCw, Trash2} from 'lucide-react'
import {CommonButton} from '@/components/common/CommonButton'
import type {EventStatus} from '@/utility/events/status'
import styles from './FormEventDetail.module.css'

type Tier = {name: string; capacity: string; tagline: string; free?: boolean}

type FormEventSettingsProps = {
  status: EventStatus
  pin: string
  packageIndex: number
  goingLive: boolean
  deleting: boolean
  onGoLive: () => void
  onRegeneratePin: () => void
  onDelete: () => void
  onUpgrade: (targetIndex: number) => void
  upgrading: boolean
  // Display prices from Stripe, index-aligned with the tier list.
  prices: string[]
}

export function FormEventSettings({
  status,
  pin,
  packageIndex,
  goingLive,
  deleting,
  onGoLive,
  onRegeneratePin,
  onDelete,
  onUpgrade,
  upgrading,
  prices,
}: FormEventSettingsProps) {
  const t = useTranslations('eventDetail')
  const tiers = useTranslations('pricing').raw('tiers') as Tier[]

  return (
    <div className={styles.settings}>
      {/* Status */}
      <section className={`${styles.card} ${status === 'live' ? styles.cardLive : ''}`}>
        <h2 className={styles.cardTitle}>{t('settings.statusTitle')}</h2>
        {status === 'draft' ? (
          <>
            <p className={styles.cardText}>{t('settings.statusDraftText')}</p>
            <p className={styles.warning}>{t('settings.statusDraftWarning')}</p>
            <div>
              <CommonButton variant="primary" size="md" onClick={onGoLive} disabled={goingLive}>
                {goingLive ? t('saving') : t('settings.goLive')}
              </CommonButton>
            </div>
          </>
        ) : (
          <p className={status === 'live' ? styles.cardTextLive : styles.cardText}>
            {status === 'live'
              ? t('settings.statusLiveText')
              : status === 'ended'
                ? t('settings.statusEndedText')
                : t('settings.statusExpiredText')}
          </p>
        )}
      </section>

      {/* Host PIN */}
      <section className={styles.card}>
        <h2 className={styles.cardTitle}>{t('settings.pinTitle')}</h2>
        <p className={styles.cardText}>{t('settings.pinText')}</p>
        <div className={styles.pinRow}>
          <span className={styles.pin}>{pin.split('').join(' ')}</span>
          <button type="button" className={styles.pinRegenerate} onClick={onRegeneratePin}>
            <RotateCw size={16} aria-hidden="true" />
            {t('settings.pinRegenerate')}
          </button>
        </div>
      </section>

      {/* Package & capacity */}
      <section className={styles.card}>
        <h2 className={styles.cardTitle}>{t('settings.packageTitle')}</h2>
        <p className={styles.cardText}>{t('settings.packageText')}</p>
        <ul className={styles.packages}>
          {tiers.map((tier, index) => {
            const current = index === packageIndex
            const lower = index < packageIndex
            return (
              <li key={tier.name} className={`${styles.pkgRow} ${current ? styles.pkgCurrent : ''}`}>
                <span className={styles.pkgInfo}>
                  <span className={styles.pkgName}>
                    {tier.name}
                    {!current && !lower ? <span className={styles.pkgPrice}> • {prices[index]}</span> : null}
                  </span>
                  <span className={styles.pkgMeta}>
                    {tier.capacity} · {tier.tagline}
                  </span>
                </span>
                {current ? (
                  <span className={styles.pkgCurrentTag}>{t('settings.packageCurrent')}</span>
                ) : lower ? (
                  <span className={styles.pkgDowngrade}>{t('settings.packageDowngrade')}</span>
                ) : (
                  <CommonButton
                    variant="primary"
                    size="sm"
                    onClick={() => onUpgrade(index)}
                    disabled={upgrading}
                  >
                    {t('settings.packageUpgrade')}
                  </CommonButton>
                )}
              </li>
            )
          })}
        </ul>
      </section>

      {/* Delete */}
      <section className={styles.card}>
        <h2 className={`${styles.cardTitle} ${styles.dangerTitle}`}>{t('settings.deleteTitle')}</h2>
        <p className={styles.cardText}>{t('settings.deleteText')}</p>
        <div>
          <CommonButton variant="danger" size="md" onClick={onDelete} disabled={deleting}>
            <Trash2 size={18} aria-hidden="true" />
            {deleting ? t('saving') : t('settings.deleteButton')}
          </CommonButton>
        </div>
      </section>
    </div>
  )
}
