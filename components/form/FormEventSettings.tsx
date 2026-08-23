'use client'

import {useLocale, useTranslations} from 'next-intl'
import {RotateCcw, RotateCw, Trash2} from 'lucide-react'
import {CommonButton} from '@/components/common/CommonButton'
import {Link} from '@/i18n/navigation'
import type {EventStatus} from '@/utility/events/status'
import {formatPrice} from '@/utility/stripe/format'
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
  // Jumps to the Eckdaten/Key-facts tab so an expired event can pick a new date.
  onEditDate: () => void
  onUpgrade: (targetIndex: number) => void
  upgrading: boolean
  // Opens the confirm dialog for wiping the saved game progress.
  onResetGame: () => void
  // Raw Stripe amounts in minor units, index-aligned with the tier list (free =
  // 0); the upgrade difference to the current package is formatted from these.
  priceCents: number[]
  currency: string
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
  onEditDate,
  onUpgrade,
  upgrading,
  onResetGame,
  priceCents,
  currency,
}: FormEventSettingsProps) {
  const t = useTranslations('eventDetail')
  const tPricing = useTranslations('pricing')
  const tCheckout = useTranslations('checkout')
  const locale = useLocale()
  const tiers = tPricing.raw('tiers') as Tier[]

  // A finished/expired event can't be upgraded (the server blocks it too), so
  // hide the upgrade buttons rather than let them 404 into a checkout error.
  const canUpgrade = status !== 'ended' && status !== 'expired'
  // Nothing to order once the top tier is reached: skip the whole consent block.
  const hasUpgrade = canUpgrade && packageIndex < tiers.length - 1

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
                : t.rich('settings.statusExpiredText', {
                    link: (chunks) => (
                      <button type="button" className={styles.inlineLink} onClick={onEditDate}>
                        {chunks}
                      </button>
                    ),
                  })}
          </p>
        )}
      </section>

      {/* Host PIN */}
      <section className={styles.card}>
        <h2 className={styles.cardTitle}>{t('settings.pinTitle')}</h2>
        <p className={styles.cardText}>{t('settings.pinText')}</p>
        <div className={styles.pinRow}>
          <span className={styles.pin}>
            {pin.split('').map((digit, index) => (
              <span key={index} className={styles.pinDigit}>
                {digit}
              </span>
            ))}
          </span>
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
            // Tiers below the current package can't be downgraded to, so we hide
            // them entirely rather than show a dead "downgrade not possible" row.
            if (index < packageIndex) return null
            return (
              <li key={tier.name} className={`${styles.pkgRow} ${current ? styles.pkgCurrent : ''}`}>
                <span className={styles.pkgInfo}>
                  <span className={styles.pkgName}>
                    {tier.name}
                    {!current ? (
                      <span className={styles.pkgPrice}>
                        {' '}
                        • {formatPrice(priceCents[index] - priceCents[packageIndex], currency, locale)}
                      </span>
                    ) : null}
                  </span>
                  <span className={styles.pkgMeta}>
                    {tier.capacity} · {tier.tagline}
                  </span>
                </span>
                {current ? (
                  <span className={styles.pkgCurrentTag}>{t('settings.packageCurrent')}</span>
                ) : canUpgrade ? (
                  <CommonButton
                    variant="primary"
                    size="sm"
                    onClick={() => onUpgrade(index)}
                    // § 312j Abs. 3 BGB: the label has to name the payment obligation.
                    disabled={upgrading}
                  >
                    {tCheckout('upgradeSubmit')}
                  </CommonButton>
                ) : null}
              </li>
            )
          })}
        </ul>

        {hasUpgrade ? (
          <>
            {/* PAngV + § 312j Abs. 2: price statement and the essentials of the
                order, right where the order is placed. One paragraph, so the
                small print reads as small print instead of three stacked notes. */}
            <p className={styles.pkgLegal}>
              {tCheckout('vatNote')}. {tCheckout('upgradeNote')} {tCheckout('period')}:{' '}
              {tCheckout('periodValue')}.{' '}
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
      </section>

      {/* Reset game */}
      <section className={styles.card}>
        <h2 className={styles.cardTitle}>{t('settings.resetGame.cardTitle')}</h2>
        <p className={styles.cardText}>{t('settings.resetGame.cardText')}</p>
        <div>
          <CommonButton variant="secondary" size="md" onClick={onResetGame}>
            <RotateCcw size={18} aria-hidden="true" />
            {t('settings.resetGame.button')}
          </CommonButton>
        </div>
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
