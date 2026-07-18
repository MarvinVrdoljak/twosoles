import {getTranslations} from 'next-intl/server'
import {Calendar, ListChecks, Users} from 'lucide-react'
import {CommonBadge} from '@/components/common/CommonBadge'
import {CommonButton} from '@/components/common/CommonButton'
import {ItemEventControl} from '@/components/items/ItemEventControl'
import type {EventStatus} from '@/utility/events/status'
import {STATUS_BADGE_VARIANT} from '@/utility/events/status'
import styles from './ItemEventCard.module.css'

type ItemEventCardProps = {
  href: string
  eventId: string
  occasion: string
  couple: string
  date: string
  guests: string
  questions: string
  status: EventStatus
}

// Event summary card on the dashboard. Status is derived by the caller.
export async function ItemEventCard({
  href,
  eventId,
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

  const statusTip = {
    draft: t('statusDraftTip'),
    live: t('statusLiveTip'),
    ended: t('statusEndedTip'),
    expired: t('statusExpiredTip'),
  }[status]

  return (
    <article className={styles.root}>
      <div className={styles.head}>
        <div className={styles.topRow}>
          <span className={styles.occasion}>{occasion}</span>
          <CommonBadge
            variant={STATUS_BADGE_VARIANT[status]}
            pulse={status === 'live'}
            tooltip={statusTip}
          >
            {statusLabel}
          </CommonBadge>
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
            <ItemEventControl eventId={eventId} />
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
