'use client'

import {useTranslations} from 'next-intl'
import {Gamepad2, Monitor} from 'lucide-react'
import {CommonModal} from '@/components/common/CommonModal'
import {Link} from '@/i18n/navigation'
import styles from './DeviceChoiceModal.module.css'

type DeviceChoiceModalProps = {
  eventId: string
  open: boolean
  onClose: () => void
}

// "What is this device?" overlay shown before launching the game. TwoSoles runs
// on two devices at once (beamer + host controls); this lets the user pick which
// role the current device takes and opens that view in a new tab. Shared by the
// event page and the dashboard.
export function DeviceChoiceModal({eventId, open, onClose}: DeviceChoiceModalProps) {
  const t = useTranslations('eventDetail')

  const tiles = [
    {
      key: 'display',
      href: `/display/${eventId}`,
      icon: Monitor,
      title: t('deviceChoice.display'),
      desc: t('deviceChoice.displayDesc'),
    },
    {
      key: 'host',
      href: `/host/${eventId}`,
      icon: Gamepad2,
      title: t('deviceChoice.host'),
      desc: t('deviceChoice.hostDesc'),
    },
  ]

  return (
    <CommonModal
      open={open}
      onClose={onClose}
      title={t('deviceChoice.title')}
      closeLabel={t('deviceChoice.cancel')}
    >
      <div className={styles.deviceChoice}>
        <p className={styles.deviceChoiceText}>{t('deviceChoice.text')}</p>
        <div className={styles.tiles}>
          {tiles.map(({key, href, icon: Icon, title, desc}) => (
            <Link
              key={key}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.tile}
              onClick={onClose}
            >
              <span className={styles.tileIcon}>
                <Icon size={26} aria-hidden="true" />
              </span>
              <span className={styles.tileTitle}>{title}</span>
              <span className={styles.tileDesc}>{desc}</span>
            </Link>
          ))}
        </div>
      </div>
    </CommonModal>
  )
}
