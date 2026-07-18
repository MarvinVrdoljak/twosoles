'use client'

import type {ReactNode} from 'react'
import {useTranslations} from 'next-intl'
import {ChevronDown} from 'lucide-react'
import {CommonTooltip} from '@/components/common/CommonTooltip'
import {FormField} from '@/components/form/FormField'
import {routing} from '@/i18n/routing'
import type {GameTheme} from '@/utility/game/types'
import {maxEventISODate, todayISODate} from './eventDraft'
import type {EventDraft} from './eventDraft'
import styles from './FormEventSteps.module.css'

type Props = {
  draft: EventDraft
  update: (patch: Partial<EventDraft>) => void
  title?: string
  subtitle?: string
  footer?: ReactNode
  readOnly?: boolean
}

type Occasion = {value: string; label: string}
type Option = {value: string; label: string}

function SelectField({
  id,
  label,
  hint,
  value,
  options,
  onChange,
  disabled,
}: {
  id: string
  label: string
  // Optional explainer shown in a hover/focus tooltip next to the label.
  hint?: string
  value: string
  options: Option[]
  onChange: (value: string) => void
  disabled?: boolean
}) {
  return (
    <div className={styles.field}>
      <label htmlFor={id} className={styles.fieldLabel}>
        {label}
        {hint ? <CommonTooltip label={hint} icon /> : null}
      </label>
      <div className={styles.selectWrap}>
        <select
          id={id}
          className={styles.select}
          value={value}
          disabled={disabled}
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

export function FormEventDetails({draft, update, title, subtitle, footer, readOnly}: Props) {
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

  const themeOptions: Option[] = (['light', 'dark'] as GameTheme[]).map((value) => ({
    value,
    label: t(`details.themeOptions.${value}`),
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
          disabled={readOnly}
        />

        <FormField
          id="event-date"
          label={t('details.dateLabel')}
          type="date"
          value={draft.date}
          required
          min={todayISODate()}
          max={maxEventISODate()}
          disabled={readOnly}
          onChange={(value) => update({date: value})}
        />

        <SelectField
          id="event-language"
          label={t('details.languageLabel')}
          value={draft.language}
          options={languageOptions}
          onChange={(value) => update({language: value})}
          disabled={readOnly}
        />

        <SelectField
          id="event-theme"
          label={t('details.themeLabel')}
          hint={t('details.themeHint')}
          value={draft.theme}
          options={themeOptions}
          onChange={(value) => update({theme: value as GameTheme})}
          disabled={readOnly}
        />
      </div>

      {footer}
    </div>
  )
}
