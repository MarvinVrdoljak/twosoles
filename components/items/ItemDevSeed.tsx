'use client'

import {useTransition} from 'react'
import {Wand2} from 'lucide-react'
import {CommonButton} from '@/components/common/CommonButton'
import {useRouter} from '@/i18n/navigation'
import {seedDummyEventsAction} from '@/utility/events/actions'

// DEV ONLY: resets the user's events to 4 dummies (one per status). Rendered
// only in development by the dashboard.
export function ItemDevSeed() {
  const [pending, startTransition] = useTransition()
  const router = useRouter()

  return (
    <CommonButton
      variant="secondary"
      size="sm"
      disabled={pending}
      onClick={() => {
        if (!window.confirm('Alle deine Events löschen und 4 Dummy-Events (je ein Status) anlegen?')) {
          return
        }
        startTransition(async () => {
          await seedDummyEventsAction()
          router.refresh()
        })
      }}
    >
      <Wand2 size={16} aria-hidden="true" />
      {pending ? 'Lege an …' : 'Dev: Dummy-Events neu anlegen'}
    </CommonButton>
  )
}
