'use client'

import {useTranslations} from 'next-intl'
import {Calendar, Download, ListChecks, PartyPopper, Play, QrCode, Users} from 'lucide-react'
import {CommonButton} from '@/components/common/CommonButton'
import type {EventStatus} from '@/utility/events/status'
import styles from './ItemEventOverview.module.css'

type ItemEventOverviewProps = {
  name1: string
  name2: string
  occasion: string
  date: string
  guests: string
  questions: string
  status: EventStatus
  guestUrl: string
  goingLive: boolean
  onGoLive: () => void
  onStub: () => void
}

export function ItemEventOverview({
  name1,
  name2,
  occasion,
  date,
  guests,
  questions,
  status,
  guestUrl,
  goingLive,
  onGoLive,
  onStub,
}: ItemEventOverviewProps) {
  const t = useTranslations('eventDetail')
  const tDash = useTranslations('dashboard')

  const statusLabel = {
    draft: tDash('statusDraft'),
    live: tDash('statusLive'),
    ended: tDash('statusEnded'),
    expired: tDash('statusExpired'),
  }[status]

  const badgeClass = {
    draft: styles.badgeDraft,
    live: styles.badgeLive,
    ended: styles.badgeEnded,
    expired: styles.badgeExpired,
  }[status]

  return (
    <aside className={styles.root}>
      <div className={styles.top}>
        <div className={styles.avatars} aria-hidden="true">
          <span className={styles.avatar}>{name1.charAt(0) || '?'}</span>
          <span className={styles.avatar}>{name2.charAt(0) || '?'}</span>
        </div>
        <span className={`${styles.badge} ${badgeClass}`}>
          <span className={styles.badgeDot} aria-hidden="true" />
          {statusLabel}
        </span>
      </div>

      <div className={styles.headline}>
        <h1 className={styles.couple}>{`${name1 || '?'} & ${name2 || '?'}`}</h1>
        <p className={styles.occasion}>{occasion}</p>
      </div>

      <ul className={styles.meta}>
        <li className={styles.metaItem}>
          <Calendar size={20} aria-hidden="true" />
          <span>{date}</span>
        </li>
        <li className={styles.metaItem}>
          <Users size={20} aria-hidden="true" />
          <span>{guests}</span>
        </li>
        <li className={styles.metaItem}>
          <ListChecks size={20} aria-hidden="true" />
          <span>{questions}</span>
        </li>
      </ul>

      <div className={styles.guest}>
        <span className={styles.qr} aria-hidden="true">
          <QrCode size={44} />
        </span>
        <span className={styles.guestText}>
          <span className={styles.guestLabel}>{t('guestLink')}</span>
          <span className={styles.guestUrl}>{guestUrl}</span>
        </span>
      </div>

      <div className={styles.actions}>
        <CommonButton variant="secondary" size="md" fullWidth onClick={onStub}>
          <Download size={18} aria-hidden="true" />
          {t('downloadQr')}
        </CommonButton>

        {status === 'draft' ? (
          <CommonButton variant="secondary" size="md" fullWidth onClick={onGoLive} disabled={goingLive}>
            <PartyPopper size={18} aria-hidden="true" />
            {goingLive ? t('saving') : t('settings.goLive')}
          </CommonButton>
        ) : null}

        {status === 'draft' || status === 'live' ? (
          <CommonButton variant="primary" size="md" fullWidth onClick={onStub}>
            <Play size={18} aria-hidden="true" />
            {status === 'live' ? t('startGame') : t('testGame')}
          </CommonButton>
        ) : null}
      </div>
    </aside>
  )
}
