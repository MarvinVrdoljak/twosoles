'use client'

import {useState} from 'react'
import {useTranslations} from 'next-intl'
import {Play} from 'lucide-react'
import {CommonButton} from '@/components/common/CommonButton'
import {DeviceChoiceModal} from '@/components/game/DeviceChoiceModal'

type ItemEventControlProps = {
  eventId: string
}

// Dashboard "control the game" action for a live event. Instead of jumping
// straight into a view, it opens the device-choice overlay (beamer vs. host) —
// the same flow as the event page.
export function ItemEventControl({eventId}: ItemEventControlProps) {
  const t = useTranslations('dashboard')
  const [deviceChoiceOpen, setDeviceChoiceOpen] = useState(false)

  return (
    <>
      <CommonButton
        variant="primary"
        size="md"
        fullWidth
        onClick={() => setDeviceChoiceOpen(true)}
      >
        <Play size={18} aria-hidden="true" />
        {t('cardControl')}
      </CommonButton>
      <DeviceChoiceModal
        eventId={eventId}
        open={deviceChoiceOpen}
        onClose={() => setDeviceChoiceOpen(false)}
      />
    </>
  )
}
