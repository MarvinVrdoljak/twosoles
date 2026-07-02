'use client'

import React, {useEffect, useRef, useState} from 'react'
import {useTranslations} from 'next-intl'
import {ImagePlus, X} from 'lucide-react'
import {PERSON_COLORS} from './eventDraft'
import type {EventDraft} from './eventDraft'
import styles from './FormEventSteps.module.css'

type Props = {
  draft: EventDraft
  update: (patch: Partial<EventDraft>) => void
  title?: string
  subtitle?: string
  footer?: React.ReactNode
  readOnly?: boolean
}

function ColorPicker({
  color,
  label,
  onSelect,
  disabled,
}: {
  color: string
  label: string
  onSelect: (value: string) => void
  disabled?: boolean
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className={styles.colorPicker} ref={ref}>
      <button
        type="button"
        className={styles.swatch}
        style={{background: color}}
        onClick={() => setOpen((value) => !value)}
        disabled={disabled}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={label}
        title={label}
      />
      {open ? (
        <div className={styles.colorMenu} role="menu">
          {PERSON_COLORS.map((option) => (
            <button
              key={option}
              type="button"
              role="menuitemradio"
              aria-checked={option === color}
              className={`${styles.colorOption} ${option === color ? styles.colorOptionActive : ''}`}
              style={{background: option}}
              onClick={() => {
                onSelect(option)
                setOpen(false)
              }}
              aria-label={option}
            />
          ))}
        </div>
      ) : null}
    </div>
  )
}

type PersonProps = {
  photo: string | null
  color: string
  name: string
  placeholder: string
  photoLabel: string
  colorLabel: string
  removeLabel: string
  onName: (value: string) => void
  onColor: (value: string) => void
  onPhoto: (file: File | null) => void
  readOnly?: boolean
}

function Person({
  photo,
  color,
  name,
  placeholder,
  photoLabel,
  colorLabel,
  removeLabel,
  onName,
  onColor,
  onPhoto,
  readOnly,
}: PersonProps) {
  const fileRef = useRef<HTMLInputElement>(null)

  const handleFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      onPhoto(file)
    }
  }

  return (
    <div className={styles.person}>
      <div className={styles.photoWrap}>
        <button
          type="button"
          className={styles.photo}
          onClick={() => fileRef.current?.click()}
          disabled={readOnly}
          aria-label={photoLabel}
          style={photo ? {backgroundImage: `url(${photo})`} : undefined}
        >
          {photo ? null : <ImagePlus size={24} aria-hidden="true" />}
        </button>
        {photo && !readOnly ? (
          <button
            type="button"
            className={styles.photoRemove}
            onClick={() => onPhoto(null)}
            aria-label={removeLabel}
          >
            <X size={14} aria-hidden="true" />
          </button>
        ) : null}
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className={styles.file}
          onChange={handleFile}
          tabIndex={-1}
        />
      </div>

      <div className={styles.nameRow}>
        <input
          className={styles.nameInput}
          type="text"
          value={name}
          placeholder={placeholder}
          required
          disabled={readOnly}
          onChange={(event) => onName(event.target.value)}
        />
        <ColorPicker color={color} label={colorLabel} onSelect={onColor} disabled={readOnly} />
      </div>
    </div>
  )
}

export function FormEventCouple({draft, update, title, subtitle, footer, readOnly}: Props) {
  const t = useTranslations('eventWizard')

  return (
    <div className={styles.stepCard}>
      {title ? (
        <div className={styles.cardHeader}>
          <h2 className={styles.cardTitle}>{title}</h2>
          {subtitle ? <p className={styles.cardSubtitle}>{subtitle}</p> : null}
        </div>
      ) : null}

      <div className={styles.couple}>
        <Person
          photo={draft.photo1}
          color={draft.color1}
          name={draft.name1}
          placeholder={t('couple.name1')}
          photoLabel={t('couple.photoLabel')}
          colorLabel={t('couple.colorLabel')}
          removeLabel={t('couple.removePhoto')}
          onName={(value) => update({name1: value})}
          onColor={(value) => update({color1: value})}
          onPhoto={(file) =>
            update({photo1File: file, photo1: file ? URL.createObjectURL(file) : null})
          }
          readOnly={readOnly}
        />

        <span className={styles.amp} aria-hidden="true">
          &amp;
        </span>

        <Person
          photo={draft.photo2}
          color={draft.color2}
          name={draft.name2}
          placeholder={t('couple.name2')}
          photoLabel={t('couple.photoLabel')}
          colorLabel={t('couple.colorLabel')}
          removeLabel={t('couple.removePhoto')}
          onName={(value) => update({name2: value})}
          onColor={(value) => update({color2: value})}
          onPhoto={(file) =>
            update({photo2File: file, photo2: file ? URL.createObjectURL(file) : null})
          }
          readOnly={readOnly}
        />
      </div>

      {footer}
    </div>
  )
}
