'use client'

import type {ReactNode} from 'react'
import {useTranslations} from 'next-intl'
import {ChevronDown} from 'lucide-react'
import {FormField} from '@/components/form/FormField'
import {routing} from '@/i18n/routing'
import {todayISODate} from './eventDraft'
import type {EventDraft} from './eventDraft'
import styles from './FormEventSteps.module.css'

type Props = {
  draft: EventDraft
  update: (patch: Partial<EventDraft>) => void
  title?: string
  subtitle?: string
  footer?: ReactNode
}

type Occasion = {value: string; label: string}
type Option = {value: string; label: string}

function SelectField({
  id,
  label,
  value,
  options,
  onChange,
}: {
  id: string
  label: string
  value: string
  options: Option[]
  onChange: (value: string) => void
}) {
  return (
    <div className={styles.field}>
      <label htmlFor={id} className={styles.fieldLabel}>
        {label}
      </label>
      <div className={styles.selectWrap}>
        <select
          id={id}
          className={styles.select}
          value={value}
          onChange={(event) => onChange(event.target.value)}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown className={styles.chevron} size={18} aria-hidden="true" />
      </div>
    </div>
  )
}

export function FormEventDetails({draft, update, title, subtitle, footer}: Props) {
  const t = useTranslations('eventWizard')
  const tNav = useTranslations('nav')

  const occasions = (t.raw('details.occasions') as Occasion[]).map((occasion) => ({
    value: occasion.value,
    label: occasion.label,
  }))

  const languageOptions = routing.locales.map((code) => ({
    value: code,
    label: tNav(`languageNames.${code}`),
  }))

  return (
    <div className={styles.stepCard}>
      {title ? (
        <div className={styles.cardHeader}>
          <h2 className={styles.cardTitle}>{title}</h2>
          {subtitle ? <p className={styles.cardSubtitle}>{subtitle}</p> : null}
        </div>
      ) : null}

      <div className={styles.fields}>
        <SelectField
          id="event-occasion"
          label={t('details.occasionLabel')}
          value={draft.occasion}
          options={occasions}
          onChange={(value) => update({occasion: value})}
        />

        <FormField
          id="event-title"
          label={t('details.titleLabel')}
          type="text"
          value={draft.title}
          placeholder={t('details.titlePlaceholder')}
          required
          onChange={(value) => update({title: value})}
        />

        <FormField
          id="event-date"
          label={t('details.dateLabel')}
          type="date"
          value={draft.date}
          required
          min={todayISODate()}
          onChange={(value) => update({date: value})}
        />

        <SelectField
          id="event-language"
          label={t('details.languageLabel')}
          value={draft.language}
          options={languageOptions}
          onChange={(value) => update({language: value})}
        />
      </div>

      {footer}
    </div>
  )
}
