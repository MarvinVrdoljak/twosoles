'use client'

import {useEffect, useState} from 'react'
import {useTranslations} from 'next-intl'
import {useSearchParams} from 'next/navigation'
import {ArrowLeft} from 'lucide-react'
import {CommonButton} from '@/components/common/CommonButton'
import {CommonModal} from '@/components/common/CommonModal'
import {useToast} from '@/components/common/CommonToast'
import {DeviceChoiceModal} from '@/components/game/DeviceChoiceModal'
import {ItemEventGuide} from '@/components/items/ItemEventGuide'
import {ItemEventOverview} from '@/components/items/ItemEventOverview'
import {Link, useRouter} from '@/i18n/navigation'
import {deriveStatus} from '@/utility/events/status'
import {confirmCheckoutAction, createCheckoutSessionAction} from '@/utility/stripe/actions'
import {createClient} from '@/utility/supabase/client'
import {FormEventCouple} from './FormEventCouple'
import {FormEventDetails} from './FormEventDetails'
import {FormEventQuestions} from './FormEventQuestions'
import {FormEventSettings} from './FormEventSettings'
import type {GameTheme} from '@/utility/game/types'
import {isEventDateInRange, PACKAGE_KEYS} from './eventDraft'
import type {EventDraft} from './eventDraft'
import styles from './FormEventDetail.module.css'

type EventData = {
  id: string
  person1_name: string
  person2_name: string
  person1_color: string | null
  person2_color: string | null
  person1_photo: string | null
  person2_photo: string | null
  occasion: string
  event_date: string | null
  game_language: string
  game_theme: string
  questions: {text: string; custom?: boolean}[]
  package: string
  started_at: string | null
  host_pin: string
}

type FormEventDetailProps = {
  event: EventData
  photo1Url: string | null
  photo2Url: string | null
  occasionLabel: string
  guests: string
  dateText: string
  userId: string
  // Raw Stripe amounts in minor units, index-aligned with the tier list (free =
  // 0). The settings tab formats the upgrade difference from these.
  priceCents: number[]
  currency: string
}

type Tab = 'overview' | 'couple' | 'details' | 'questions' | 'guide' | 'settings'

// Valid values for the `?tab=` deep-link param — keeps the URL and the active
// tab in sync so links can jump straight to e.g. Settings or the Guide.
const TAB_KEYS: Tab[] = ['overview', 'couple', 'details', 'questions', 'guide', 'settings']

function parseTab(value: string | null): Tab | null {
  return value && (TAB_KEYS as string[]).includes(value) ? (value as Tab) : null
}

async function uploadPhoto(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  eventId: string,
  index: number,
  file: File,
) {
  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
  const path = `${userId}/${eventId}/person${index}.${ext}`
  const {error} = await supabase.storage
    .from('event-photos')
    .upload(path, file, {upsert: true, contentType: file.type})
  if (error) throw error
  return path
}

export function FormEventDetail({
  event,
  photo1Url,
  photo2Url,
  occasionLabel,
  guests,
  dateText,
  userId,
  priceCents,
  currency,
}: FormEventDetailProps) {
  const t = useTranslations('eventDetail')
  const tDash = useTranslations('dashboard')
  const router = useRouter()
  const searchParams = useSearchParams()
  const {toast} = useToast()

  // A valid `?tab=` deep-link wins over the default; otherwise fall back to the
  // content default (the mobile/desktop effect below still adjusts on mount).
  const [tab, setTab] = useState<Tab>(() => parseTab(searchParams.get('tab')) ?? 'couple')
  const [saving, setSaving] = useState(false)
  const [goingLive, setGoingLive] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [pin, setPin] = useState(event.host_pin)
  const [startedAt, setStartedAt] = useState(event.started_at)
  const [goLiveConfirmOpen, setGoLiveConfirmOpen] = useState(false)
  const [deviceChoiceOpen, setDeviceChoiceOpen] = useState(false)
  const [upgrading, setUpgrading] = useState(false)
  const [resetGameOpen, setResetGameOpen] = useState(false)
  const [resettingGame, setResettingGame] = useState(false)

  // Most notices are errors; success + info pass their type explicitly.
  const notify = (text: string, type: 'success' | 'error' | 'info' = 'error') => toast(text, type)

  // The overview lives in the sidebar on desktop, but on mobile it becomes the
  // first tab. Default to it on mobile and fall back to a content tab once the
  // viewport grows past the sidebar breakpoint (matches the CSS layout switch).
  useEffect(() => {
    const desktop = window.matchMedia('(min-width: 1024px)')
    // Don't clobber an explicit deep-link (?tab=…) with the mobile default.
    if (!desktop.matches && !parseTab(searchParams.get('tab'))) setTab('overview')
    const onChange = () => {
      if (desktop.matches) setTab((current) => (current === 'overview' ? 'couple' : current))
    }
    desktop.addEventListener('change', onChange)
    return () => desktop.removeEventListener('change', onChange)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Returning from Stripe Checkout: confirm the payment right here (rather than
  // waiting for the async webhook) so the package unlocks on screen immediately.
  // This runs ONLY on the return from Stripe (the URL carries ?checkout=…); we
  // strip those params through the Next router right away, so a reload or
  // refresh never re-shows the confirmation.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const checkout = params.get('checkout')
    const sessionId = params.get('session_id')
    if (!checkout) return

    // Remove the checkout params via the router (not window.history) so they're
    // gone from Next's history state too — window.history alone gets re-added on
    // the next refresh. Land on the settings tab: that's where the upgrade lives,
    // and it preserves the tab context after the Stripe round-trip.
    router.replace(`/dashboard/events/${event.id}?tab=settings`)
    setTab('settings')

    if (checkout === 'success' && sessionId) {
      notify(t('checkoutConfirming'), 'info')
      void confirmCheckoutAction(sessionId)
        .then((result) => {
          if (result.ok) {
            notify(t('checkoutSuccess'), 'success')
            update({packageIndex: PACKAGE_KEYS.indexOf(result.package)})
            router.refresh()
          } else {
            notify(t('checkoutPending'), 'info')
          }
        })
        // The action swallows its own errors, but a transport-level failure
        // could still reject — don't leave the "confirming…" notice hanging.
        .catch(() => notify(t('checkoutPending'), 'info'))
    } else if (checkout === 'canceled') {
      notify(t('checkoutCanceled'), 'info')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const [draft, setDraft] = useState<EventDraft>(() => ({
    name1: event.person1_name,
    name2: event.person2_name,
    color1: event.person1_color ?? '#a67070',
    color2: event.person2_color ?? '#1f2937',
    photo1: photo1Url,
    photo2: photo2Url,
    photo1File: null,
    photo2File: null,
    occasion: event.occasion,
    date: event.event_date ?? '',
    language: event.game_language,
    theme: (event.game_theme as GameTheme) ?? 'light',
    questions: (event.questions ?? []).map((q, index) => ({
      id: `q-${index}`,
      text: q.text,
    })),
    packageIndex: Math.max(0, PACKAGE_KEYS.indexOf(event.package as (typeof PACKAGE_KEYS)[number])),
  }))

  const update = (patch: Partial<EventDraft>) => setDraft((current) => ({...current, ...patch}))

  const status = deriveStatus({started_at: startedAt, event_date: event.event_date})
  // Ended events are archived — the edit tabs become read-only (no saving).
  const readOnly = status === 'ended'

  // Upgrade to a higher package: hand off to Stripe Checkout for the price
  // difference. The event stays on its current package until the webhook confirms.
  const upgrade = async (targetIndex: number) => {
    setUpgrading(true)
    const result = await createCheckoutSessionAction(event.id, PACKAGE_KEYS[targetIndex])
    if ('url' in result) {
      window.location.href = result.url
    } else {
      notify(t('checkoutError'))
      setUpgrading(false)
    }
  }

  const save = async () => {
    // The date input's min/max only limit the picker — a manually typed past (or
    // far-future) date slips through, so re-check the range before persisting.
    if (draft.date && !isEventDateInRange(draft.date)) {
      setTab('details')
      notify(t('dateInvalid'))
      return
    }
    setSaving(true)
    try {
      const supabase = createClient()
      let photo1 = event.person1_photo
      let photo2 = event.person2_photo
      if (draft.photo1File) photo1 = await uploadPhoto(supabase, userId, event.id, 1, draft.photo1File)
      if (draft.photo2File) photo2 = await uploadPhoto(supabase, userId, event.id, 2, draft.photo2File)

      const {error} = await supabase
        .from('events')
        .update({
          person1_name: draft.name1.trim(),
          person2_name: draft.name2.trim(),
          person1_color: draft.color1,
          person2_color: draft.color2,
          person1_photo: photo1,
          person2_photo: photo2,
          occasion: draft.occasion,
          event_date: draft.date || null,
          game_language: draft.language,
          game_theme: draft.theme,
          questions: draft.questions.map((q) => ({text: q.text})),
          // NOTE: `package` is deliberately NOT saved here. It's owned solely by
          // the Stripe purchase/upgrade flow (webhook + success confirm); writing
          // it from the edit form would reset a paid event back to its stale
          // draft value (e.g. free).
        })
        .eq('id', event.id)
      if (error) throw error
      notify(t('saveSuccess'), 'success')
      router.refresh()
    } catch {
      notify(t('saveError'))
    } finally {
      setSaving(false)
    }
  }

  const goLive = async () => {
    setGoingLive(true)
    try {
      const supabase = createClient()
      const startedIso = new Date().toISOString()
      const {error} = await supabase
        .from('events')
        .update({started_at: startedIso})
        .eq('id', event.id)
        .is('started_at', null)
      if (error) throw error
      setStartedAt(startedIso)
      setGoLiveConfirmOpen(false)
      router.refresh()
    } catch {
      notify(t('saveError'))
    } finally {
      setGoingLive(false)
    }
  }

  // Both go-live buttons open a confirmation first (one-time, 48h window).
  const requestGoLive = () => {
    setGoLiveConfirmOpen(true)
  }

  const remove = async () => {
    if (!window.confirm(t('settings.deleteConfirm'))) return
    setDeleting(true)
    const supabase = createClient()
    const {error} = await supabase.from('events').delete().eq('id', event.id)
    if (error) {
      notify(t('saveError'))
      setDeleting(false)
      return
    }
    router.push('/dashboard')
  }

  const regeneratePin = async () => {
    const next = String(Math.floor(Math.random() * 10000)).padStart(4, '0')
    const supabase = createClient()
    const {error} = await supabase.from('events').update({host_pin: next}).eq('id', event.id)
    if (error) {
      notify(t('saveError'))
      return
    }
    setPin(next)
    notify(t('settings.pinRegenerated'), 'success')
  }

  // Clear the persisted game snapshot so the next host session starts fresh in
  // the lobby (owner-scoped via RLS, same as the other edits here). Any live
  // screens keep running until the host resets or restarts.
  const resetGame = async () => {
    setResettingGame(true)
    const supabase = createClient()
    const {error} = await supabase.from('events').update({game_state: null}).eq('id', event.id)
    setResettingGame(false)
    setResetGameOpen(false)
    if (error) {
      notify(t('settings.resetGame.error'))
      return
    }
    notify(t('settings.resetGame.success'), 'success')
  }

  const saveButton = (
    <div className={styles.saveRow}>
      <CommonButton variant="primary" size="md" onClick={save} disabled={saving}>
        {saving ? t('saving') : t('save')}
      </CommonButton>
    </div>
  )

  // Switch tabs and anchor the choice in the URL so it's shareable/deep-linkable.
  const goToTab = (key: Tab) => {
    setTab(key)
    router.replace(`/dashboard/events/${event.id}?tab=${key}`, {scroll: false})
  }

  const tabs: {key: Tab; label: string; mobileOnly?: boolean}[] = [
    {key: 'overview', label: t('tabs.overview'), mobileOnly: true},
    {key: 'couple', label: t('tabs.couple')},
    {key: 'details', label: t('tabs.details')},
    {key: 'questions', label: t('tabs.questions')},
    {key: 'guide', label: t('tabs.guide')},
    {key: 'settings', label: t('tabs.settings')},
  ]

  return (
    <div className={styles.root}>
      <Link href="/dashboard" className={styles.back}>
        <ArrowLeft size={16} aria-hidden="true" />
        {t('back')}
      </Link>

      <div className={styles.layout}>
        <div className={`${styles.overview} ${tab === 'overview' ? styles.overviewActive : ''}`}>
          <ItemEventOverview
            name1={draft.name1}
            name2={draft.name2}
            occasion={occasionLabel}
            gameLanguage={draft.language}
            date={dateText}
            guests={guests}
            questions={tDash('cardQuestions', {count: draft.questions.length})}
            status={status}
            eventId={event.id}
            goingLive={goingLive}
            onGoLive={requestGoLive}
            onPlay={() => setDeviceChoiceOpen(true)}
          />
        </div>

        <nav className={styles.tabs} aria-label={t('tabs.settings')}>
          {tabs.map((item) => (
            <button
              key={item.key}
              type="button"
              className={`${styles.tab} ${item.mobileOnly ? styles.tabMobile : ''} ${tab === item.key ? styles.tabActive : ''}`}
              onClick={() => goToTab(item.key)}
              aria-current={tab === item.key ? 'page' : undefined}
            >
              {item.label}
            </button>
          ))}
        </nav>

        <div className={styles.content}>
          {tab === 'couple' ? (
            <FormEventCouple
              draft={draft}
              update={update}
              title={t('coupleTitle')}
              subtitle={t('coupleSubtitle')}
              footer={readOnly ? undefined : saveButton}
              readOnly={readOnly}
            />
          ) : null}
          {tab === 'details' ? (
            <FormEventDetails
              draft={draft}
              update={update}
              title={t('detailsTitle')}
              footer={readOnly ? undefined : saveButton}
              readOnly={readOnly}
            />
          ) : null}
          {tab === 'questions' ? (
            <FormEventQuestions
              draft={draft}
              update={update}
              title={t('questionsTitle')}
              subtitle={t('questionsSubtitle')}
              footer={readOnly ? undefined : saveButton}
              readOnly={readOnly}
            />
          ) : null}
          {tab === 'guide' ? (
            <ItemEventGuide
              eventId={event.id}
              couple={`${draft.name1 || '?'} & ${draft.name2 || '?'}`}
              gameLanguage={draft.language}
              onOpenSettings={() => goToTab('settings')}
            />
          ) : null}
          {tab === 'settings' ? (
            <FormEventSettings
              status={status}
              pin={pin}
              packageIndex={draft.packageIndex}
              goingLive={goingLive}
              deleting={deleting}
              onGoLive={requestGoLive}
              onRegeneratePin={regeneratePin}
              onDelete={remove}
              onEditDate={() => goToTab('details')}
              onUpgrade={upgrade}
              upgrading={upgrading}
              onResetGame={() => setResetGameOpen(true)}
              priceCents={priceCents}
              currency={currency}
            />
          ) : null}
        </div>
      </div>

      <CommonModal
        open={goLiveConfirmOpen}
        onClose={() => setGoLiveConfirmOpen(false)}
        title={t('goLiveConfirm.title')}
        closeLabel={t('goLiveConfirm.cancel')}
        footer={
          <>
            <CommonButton
              variant="secondary"
              size="md"
              onClick={() => setGoLiveConfirmOpen(false)}
            >
              {t('goLiveConfirm.cancel')}
            </CommonButton>
            <CommonButton variant="primary" size="md" onClick={goLive} disabled={goingLive}>
              {goingLive ? t('saving') : t('goLiveConfirm.confirm')}
            </CommonButton>
          </>
        }
      >
        <div className={styles.goLive}>
          <p className={styles.goLiveText}>{t('goLiveConfirm.text')}</p>
          <ul className={styles.goLivePoints}>
            {(t.raw('goLiveConfirm.points') as string[]).map((point) => (
              <li key={point}>{point}</li>
            ))}
          </ul>
        </div>
      </CommonModal>

      <DeviceChoiceModal
        eventId={event.id}
        open={deviceChoiceOpen}
        onClose={() => setDeviceChoiceOpen(false)}
      />

      <CommonModal
        open={resetGameOpen}
        onClose={() => setResetGameOpen(false)}
        title={t('settings.resetGame.title')}
        closeLabel={t('settings.resetGame.cancel')}
        footer={
          <>
            <CommonButton
              variant="secondary"
              size="md"
              onClick={() => setResetGameOpen(false)}
              disabled={resettingGame}
            >
              {t('settings.resetGame.cancel')}
            </CommonButton>
            <CommonButton
              variant="danger"
              size="md"
              onClick={resetGame}
              disabled={resettingGame}
            >
              {resettingGame ? t('saving') : t('settings.resetGame.confirm')}
            </CommonButton>
          </>
        }
      >
        <p className={styles.goLiveText}>{t('settings.resetGame.text')}</p>
      </CommonModal>
    </div>
  )
}
