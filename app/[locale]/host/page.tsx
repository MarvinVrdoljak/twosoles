import {getTranslations, setRequestLocale} from 'next-intl/server'
import {redirect} from 'next/navigation'
import {CommonPageHeader} from '@/components/common/CommonPageHeader'
import {ItemAddEventCard} from '@/components/items/ItemAddEventCard'
import {ItemEventCard} from '@/components/items/ItemEventCard'
import {LayoutDashboard} from '@/components/layout/LayoutDashboard'
import {getPathname} from '@/i18n/navigation'
import type {Locale} from '@/i18n/routing'
import {deriveStatus} from '@/utility/events/status'
import {createClient} from '@/utility/supabase/server'
import {getUser} from '@/utility/supabase/user'
import styles from './page.module.css'

type HostPageProps = {
  params: Promise<{locale: Locale}>
}

type EventRow = {
  id: string
  person1_name: string
  person2_name: string
  occasion: string | null
  event_date: string | null
  package: string
  questions: unknown
  started_at: string | null
}

type Occasion = {value: string; label: string}
type Tier = {name: string; capacity: string}

const PACKAGE_INDEX: Record<string, number> = {free: 0, small: 1, medium: 2, large: 3}

// Signed-in dashboard: lists the user's events (RLS-scoped) plus the create CTA.
export default async function HostPage({params}: HostPageProps) {
  const {locale} = await params
  setRequestLocale(locale)

  const user = await getUser()
  if (!user) {
    redirect(getPathname({href: '/login', locale}))
  }

  const t = await getTranslations('dashboard')
  const tWizard = await getTranslations('eventWizard')
  const tPricing = await getTranslations('pricing')

  const occasions = tWizard.raw('details.occasions') as Occasion[]
  const tiers = tPricing.raw('tiers') as Tier[]
  const dateFormat = new Intl.DateTimeFormat(locale, {day: 'numeric', month: 'long', year: 'numeric'})

  const supabase = await createClient()
  const {data} = await supabase
    .from('events')
    .select('id, person1_name, person2_name, occasion, event_date, package, questions, started_at')
    .order('created_at', {ascending: false})
  const events = (data ?? []) as EventRow[]

  return (
    <LayoutDashboard active="events">
      <div className={styles.root}>
        <CommonPageHeader title={t('eventsTitle')} subtitle={t('eventsSubtitle')} />

        <div className={styles.grid}>
          {events.map((event) => {
            const tier = tiers[PACKAGE_INDEX[event.package] ?? 0]
            const occasion =
              occasions.find((item) => item.value === event.occasion)?.label ?? event.occasion ?? ''
            const questionCount = Array.isArray(event.questions) ? event.questions.length : 0
            return (
              <ItemEventCard
                key={event.id}
                href={`/host/events/${event.id}`}
                occasion={occasion}
                couple={`${event.person1_name} & ${event.person2_name}`}
                date={
                  event.event_date
                    ? dateFormat.format(new Date(`${event.event_date}T00:00:00`))
                    : '—'
                }
                guests={t('cardGuests', {capacity: tier?.capacity ?? '', name: tier?.name ?? ''})}
                questions={t('cardQuestions', {count: questionCount})}
                status={deriveStatus(event)}
              />
            )
          })}

          <ItemAddEventCard
            href="/host/create"
            title={t('addEventTitle')}
            subtitle={t('addEventSubtitle')}
          />
        </div>
      </div>
    </LayoutDashboard>
  )
}
