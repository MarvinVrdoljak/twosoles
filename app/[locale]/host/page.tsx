import {getTranslations, setRequestLocale} from 'next-intl/server'
import {redirect} from 'next/navigation'
import {ItemAddEventCard} from '@/components/items/ItemAddEventCard'
import {LayoutDashboard} from '@/components/layout/LayoutDashboard'
import {getPathname} from '@/i18n/navigation'
import type {Locale} from '@/i18n/routing'
import {getUser} from '@/utility/supabase/user'
import styles from './page.module.css'

type HostPageProps = {
  params: Promise<{locale: Locale}>
}

// Signed-in dashboard. Empty state (no events yet). Non-authenticated visitors
// are sent to /login.
export default async function HostPage({params}: HostPageProps) {
  const {locale} = await params
  setRequestLocale(locale)

  if (!(await getUser())) {
    redirect(getPathname({href: '/login', locale}))
  }

  const t = await getTranslations('dashboard')

  return (
    <LayoutDashboard active="events">
      <div className={styles.root}>
        <div className={styles.header}>
          <h1 className={styles.title}>{t('eventsTitle')}</h1>
          <p className={styles.subtitle}>{t('eventsSubtitle')}</p>
        </div>

        <ItemAddEventCard
          href="/host/create"
          title={t('addEventTitle')}
          subtitle={t('addEventSubtitle')}
        />
      </div>
    </LayoutDashboard>
  )
}
