'use client'

import {useState} from 'react'
import {useLocale, useTranslations} from 'next-intl'
import {LayoutEventCreation} from '@/components/layout/LayoutEventCreation'
import {useRouter} from '@/i18n/navigation'
import {createClient} from '@/utility/supabase/client'
import {createCheckoutSessionAction} from '@/utility/stripe/actions'
import {FormEventCouple} from './FormEventCouple'
import {FormEventDetails} from './FormEventDetails'
import {FormEventQuestions} from './FormEventQuestions'
import {FormEventPackage} from './FormEventPackage'
import {FormEventSummary} from './FormEventSummary'
import {PACKAGE_KEYS, PERSON_COLORS, todayISODate} from './eventDraft'
import type {EventDraft} from './eventDraft'

const TOTAL_STEPS = 5

type FormEventWizardProps = {
  userId: string
  // Display prices from Stripe, index-aligned with the tier list.
  prices: string[]
}

// Upload one couple photo to the private bucket under "<user>/<event>/…" and
// return its storage path.
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

// Client-side, multi-step event-creation wizard. Holds the whole draft in local
// state and swaps the step card. "Create for free" persists to Supabase on the
// free package; the paid path still awaits Stripe.
export function FormEventWizard({userId, prices}: FormEventWizardProps) {
  const t = useTranslations('eventWizard')
  const locale = useLocale()
  const router = useRouter()

  const [step, setStep] = useState(1)
  const [notice, setNotice] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)

  const [draft, setDraft] = useState<EventDraft>(() => ({
    name1: '',
    name2: '',
    color1: PERSON_COLORS[0],
    color2: PERSON_COLORS[1],
    photo1: null,
    photo2: null,
    photo1File: null,
    photo2File: null,
    occasion: 'wedding',
    date: todayISODate(),
    language: locale,
    questions: [],
    packageIndex: 2,
  }))

  const update = (patch: Partial<EventDraft>) => setDraft((current) => ({...current, ...patch}))

  const isLast = step === TOTAL_STEPS
  const isFree = draft.packageIndex === 0

  // Required-field gating: names on step 1, title + date on step 2, at least
  // one question on step 3.
  const stepValid =
    step === 1
      ? draft.name1.trim() !== '' && draft.name2.trim() !== ''
      : step === 2
        ? draft.date !== ''
        : step === 3
          ? draft.questions.length > 0
          : true

  // Persist the event as a free-tier row, upload any photos, and return its id.
  // The event always starts on `free`; a paid package is only unlocked once
  // Stripe confirms the payment via webhook. Returns null on failure.
  const createEvent = async (): Promise<string | null> => {
    setCreating(true)
    setNotice(null)
    try {
      const supabase = createClient()
      const {data, error} = await supabase
        .from('events')
        .insert({
          user_id: userId,
          person1_name: draft.name1.trim(),
          person2_name: draft.name2.trim(),
          person1_color: draft.color1,
          person2_color: draft.color2,
          occasion: draft.occasion,
          event_date: draft.date || null,
          game_language: draft.language,
          questions: draft.questions.map((q) => ({text: q.text})),
          package: PACKAGE_KEYS[0],
        })
        .select('id')
        .single()
      if (error) throw error

      const eventId = (data as {id: string}).id
      const patch: {person1_photo?: string; person2_photo?: string} = {}
      if (draft.photo1File) {
        patch.person1_photo = await uploadPhoto(supabase, userId, eventId, 1, draft.photo1File)
      }
      if (draft.photo2File) {
        patch.person2_photo = await uploadPhoto(supabase, userId, eventId, 2, draft.photo2File)
      }
      if (Object.keys(patch).length > 0) {
        await supabase.from('events').update(patch).eq('id', eventId)
      }

      return eventId
    } catch {
      setNotice(t('summary.createError'))
      setCreating(false)
      return null
    }
  }

  // Create the event for free and go to the dashboard.
  const createFreeAndGo = async () => {
    const eventId = await createEvent()
    if (eventId) router.push('/dashboard')
  }

  // Main CTA on the summary step. Free → dashboard; paid → create as free, then
  // hand off to Stripe Checkout (the webhook lifts it onto the paid package).
  const finish = async () => {
    const eventId = await createEvent()
    if (!eventId) return

    if (isFree) {
      router.push('/dashboard')
      return
    }

    const result = await createCheckoutSessionAction(eventId, PACKAGE_KEYS[draft.packageIndex])
    if ('url' in result) {
      window.location.href = result.url
    } else {
      setNotice(t('summary.checkoutError'))
      setCreating(false)
    }
  }

  const goNext = () => {
    if (isLast) {
      void finish()
      return
    }
    setNotice(null)
    setStep((current) => Math.min(TOTAL_STEPS, current + 1))
  }

  const goBack = () => {
    setNotice(null)
    setStep((current) => Math.max(1, current - 1))
  }

  // Sidebar navigation: jump back to an already-completed step (never forward).
  const goToStep = (target: number) => {
    if (target >= step) return
    setNotice(null)
    setStep(target)
  }

  const stepMeta: Record<number, {title: string; subtitle: string}> = {
    1: {title: t('couple.title'), subtitle: t('couple.subtitle')},
    2: {title: t('details.title'), subtitle: t('details.subtitle')},
    3: {title: t('questions.title'), subtitle: t('questions.subtitle')},
    4: {title: t('package.title'), subtitle: t('package.subtitle')},
    5: {title: t('summary.title'), subtitle: t('summary.subtitle')},
  }

  return (
    <LayoutEventCreation
      activeStep={step}
      eyebrow={t('stepOf', {current: step, total: TOTAL_STEPS})}
      title={stepMeta[step].title}
      subtitle={stepMeta[step].subtitle}
      onBack={goBack}
      onNext={goNext}
      onStepClick={goToStep}
      nextLabel={
        isLast
          ? isFree
            ? creating
              ? t('summary.creatingFree')
              : t('summary.freeButton')
            : t('summary.submit')
          : t('next')
      }
      nextDisabled={!stepValid || creating}
    >
      {step === 1 ? <FormEventCouple draft={draft} update={update} /> : null}
      {step === 2 ? <FormEventDetails draft={draft} update={update} /> : null}
      {step === 3 ? <FormEventQuestions draft={draft} update={update} /> : null}
      {step === 4 ? <FormEventPackage draft={draft} update={update} prices={prices} /> : null}
      {step === 5 ? (
        <FormEventSummary
          draft={draft}
          notice={notice}
          creating={creating}
          showFreeCard={!isFree}
          onFree={createFreeAndGo}
        />
      ) : null}
    </LayoutEventCreation>
  )
}
