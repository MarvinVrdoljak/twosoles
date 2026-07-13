import {getTranslations, setRequestLocale} from 'next-intl/server'
import {notFound, redirect} from 'next/navigation'
import {FormEventDetail} from '@/components/form/FormEventDetail'
import {LayoutDashboard} from '@/components/layout/LayoutDashboard'
import {getPathname} from '@/i18n/navigation'
import type {Locale} from '@/i18n/routing'
import {getTierPriceDisplays} from '@/utility/stripe/prices'
import {createClient} from '@/utility/supabase/server'
import {getUser} from '@/utility/supabase/user'

type EventDetailPageProps = {
  params: Promise<{locale: Locale; id: string}>
}

type Occasion = {value: string; label: string}
type Tier = {name: string; capacity: string}

const PACKAGE_INDEX: Record<string, number> = {free: 0, small: 1, medium: 2, large: 3}

export default async function EventDetailPage({params}: EventDetailPageProps) {
  const {locale, id} = await params
  setRequestLocale(locale)

  const user = await getUser()
  if (!user) {
    redirect(getPathname({href: '/login', locale}))
  }

  const supabase = await createClient()
  const {data: event} = await supabase.from('events').select('*').eq('id', id).maybeSingle()
  if (!event) {
    notFound()
  }

  // Private photos need short-lived signed URLs for the preview.
  const sign = async (path: string | null) => {
    if (!path) return null
    const {data} = await supabase.storage.from('event-photos').createSignedUrl(path, 3600)
    return data?.signedUrl ?? null
  }
  const [photo1Url, photo2Url] = await Promise.all([
    sign(event.person1_photo),
    sign(event.person2_photo),
  ])

  const t = await getTranslations('dashboard')
  const tWizard = await getTranslations('eventWizard')
  const tPricing = await getTranslations('pricing')

  const occasions = tWizard.raw('details.occasions') as Occasion[]
  const tiers = tPricing.raw('tiers') as Tier[]
  const tier = tiers[PACKAGE_INDEX[event.package] ?? 0]
  const occasionLabel =
    occasions.find((item) => item.value === event.occasion)?.label ?? event.occasion ?? ''
  const dateFormat = new Intl.DateTimeFormat(locale, {day: 'numeric', month: 'long', year: 'numeric'})
  const dateText = event.event_date
    ? dateFormat.format(new Date(`${event.event_date}T00:00:00`))
    : '—'
  const guests = t('cardGuests', {capacity: tier?.capacity ?? '', name: tier?.name ?? ''})
  const prices = await getTierPriceDisplays(locale, tPricing('freePrice'))

  return (
    <LayoutDashboard active="events">
      <FormEventDetail
        event={event}
        photo1Url={photo1Url}
        photo2Url={photo2Url}
        occasionLabel={occasionLabel}
        guests={guests}
        dateText={dateText}
        userId={user.id}
        prices={prices}
      />
    </LayoutDashboard>
  )
}
