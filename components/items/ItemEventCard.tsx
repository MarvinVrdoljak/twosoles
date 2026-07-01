import {getTranslations} from 'next-intl/server'
import {Calendar, ListChecks, Play, Users} from 'lucide-react'
import {CommonButton} from '@/components/common/CommonButton'
import type {EventStatus} from '@/utility/events/status'
import styles from './ItemEventCard.module.css'

type ItemEventCardProps = {
  href: string
  occasion: string
  couple: string
  date: string
  guests: string
  questions: string
  status: EventStatus
}

// Event summary card on the dashboard. Actions are placeholders until the
// per-event pages exist. Status is derived by the caller.
export async function ItemEventCard({
  href,
  occasion,
  couple,
  date,
  guests,
  questions,
  status,
}: ItemEventCardProps) {
  const t = await getTranslations('dashboard')

  const statusLabel = {
    draft: t('statusDraft'),
    live: t('statusLive'),
    ended: t('statusEnded'),
    expired: t('statusExpired'),
  }[status]

  const badgeClass = {
    draft: styles.badgeDraft,
    live: styles.badgeLive,
    ended: styles.badgeEnded,
    expired: styles.badgeExpired,
  }[status]

  return (
    <article className={styles.root}>
      <div className={styles.head}>
        <div className={styles.topRow}>
          <span className={styles.occasion}>{occasion}</span>
          <span className={`${styles.badge} ${badgeClass}`}>
            <span className={styles.badgeDot} aria-hidden="true" />
            {statusLabel}
          </span>
        </div>
        <h2 className={styles.couple}>{couple}</h2>
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

      <div className={styles.actions}>
        {status === 'live' ? (
          <>
            <CommonButton href={href} variant="primary" size="md" fullWidth>
              <Play size={18} aria-hidden="true" />
              {t('cardControl')}
            </CommonButton>
            <CommonButton href={href} variant="secondary" size="md" fullWidth>
              {t('cardManage')}
            </CommonButton>
          </>
        ) : status === 'ended' ? (
          <CommonButton href={href} variant="primary" size="md" fullWidth>
            {t('cardSummary')}
          </CommonButton>
        ) : (
          <CommonButton href={href} variant="primary" size="md" fullWidth>
            {t('cardManage')}
          </CommonButton>
        )}
      </div>
    </article>
  )
}
