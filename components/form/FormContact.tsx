'use client'

import {useState, useTransition} from 'react'
import {useTranslations} from 'next-intl'
import {MailCheck} from 'lucide-react'
import {CommonButton} from '@/components/common/CommonButton'
import {CommonSelect, type SelectOption} from '@/components/common/CommonSelect'
import {FormField} from '@/components/form/FormField'
import {Link} from '@/i18n/navigation'
import styles from './FormContact.module.css'

const WEB3FORMS_ENDPOINT = 'https://api.web3forms.com/submit'
const SUBJECT_KEYS = ['general', 'event', 'technical', 'bigEvent', 'feedback', 'other'] as const

type SubjectKey = (typeof SUBJECT_KEYS)[number]

type Fields = {
  firstName: string
  lastName: string
  email: string
  weddingDate: string
  guestCount: string
  message: string
}

const EMPTY: Fields = {
  firstName: '',
  lastName: '',
  email: '',
  weddingDate: '',
  guestCount: '',
  message: '',
}

type FormContactProps = {
  // Web3Forms access key. It is a public "form id" (safe in the client by design)
  // and is submitted straight from the browser: Web3Forms sits behind Cloudflare,
  // which blocks server-side (bot-looking) requests but allows browser origins.
  accessKey: string
}

export function FormContact({accessKey}: FormContactProps) {
  const t = useTranslations('contact.form')
  const [subject, setSubject] = useState<SubjectKey | ''>('')
  const [fields, setFields] = useState<Fields>(EMPTY)
  const [botcheck, setBotcheck] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)
  const [pending, startTransition] = useTransition()

  const subjectOptions: SelectOption[] = SUBJECT_KEYS.map((key) => ({
    value: key,
    label: t(`subjects.${key}`),
  }))

  const set = (key: keyof Fields) => (value: string) =>
    setFields((prev) => ({...prev, [key]: value}))

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)

    if (!subject) {
      setError(t('errors.subject'))
      return
    }
    if (!accessKey) {
      setError(t('errors.failed'))
      return
    }

    const subjectLabel = t(`subjects.${subject}`)

    startTransition(async () => {
      try {
        const response = await fetch(WEB3FORMS_ENDPOINT, {
          method: 'POST',
          headers: {'Content-Type': 'application/json', Accept: 'application/json'},
          body: JSON.stringify({
            access_key: accessKey,
            subject: `Neue Kontaktanfrage: ${subjectLabel}`,
            from_name: `${fields.firstName} ${fields.lastName}`.trim(),
            // Web3Forms uses `email` as the reply-to address.
            email: fields.email,
            replyto: fields.email,
            // Web3Forms' native honeypot — a filled value is treated as spam.
            botcheck,
            // Readable fields for the notification email body.
            Anliegen: subjectLabel,
            Vorname: fields.firstName,
            Nachname: fields.lastName,
            Hochzeitsdatum: fields.weddingDate || '—',
            'Anzahl Gäste': fields.guestCount || '—',
            Nachricht: fields.message,
          }),
        })

        const data = (await response.json()) as {success?: boolean}
        if (response.ok && data.success) {
          setSent(true)
          return
        }
        setError(t('errors.failed'))
      } catch {
        setError(t('errors.failed'))
      }
    })
  }

  if (sent) {
    return (
      <div className={styles.card}>
        <div className={styles.sent} role="status">
          <MailCheck className={styles.sentIcon} size={40} aria-hidden="true" />
          <h2 className={styles.sentTitle}>{t('success.title')}</h2>
          <p className={styles.sentText}>{t('success.text')}</p>
        </div>
      </div>
    )
  }

  return (
    <form className={styles.card} onSubmit={handleSubmit} noValidate>
      <div className={styles.field}>
        <span className={styles.label} id="contact-subject-label">
          {t('subjectLabel')} <span aria-hidden="true">*</span>
        </span>
        <CommonSelect
          options={subjectOptions}
          value={subject}
          onChange={(value) => setSubject(value as SubjectKey)}
          placeholder={t('subjectPlaceholder')}
          ariaLabel={t('subjectLabel')}
          variant="input"
          className={styles.select}
        />
      </div>

      <div className={styles.row}>
        <FormField
          id="contact-first-name"
          label={`${t('firstNameLabel')} *`}
          type="text"
          autoComplete="given-name"
          placeholder={t('firstNamePlaceholder')}
          required
          value={fields.firstName}
          onChange={set('firstName')}
        />
        <FormField
          id="contact-last-name"
          label={`${t('lastNameLabel')} *`}
          type="text"
          autoComplete="family-name"
          placeholder={t('lastNamePlaceholder')}
          required
          value={fields.lastName}
          onChange={set('lastName')}
        />
      </div>

      <FormField
        id="contact-email"
        label={`${t('emailLabel')} *`}
        type="email"
        autoComplete="email"
        placeholder={t('emailPlaceholder')}
        required
        value={fields.email}
        onChange={set('email')}
      />

      <div className={styles.row}>
        <FormField
          id="contact-wedding-date"
          label={t('weddingDateLabel')}
          type="date"
          value={fields.weddingDate}
          onChange={set('weddingDate')}
        />
        <FormField
          id="contact-guest-count"
          label={t('guestCountLabel')}
          type="number"
          min="0"
          placeholder={t('guestCountPlaceholder')}
          value={fields.guestCount}
          onChange={set('guestCount')}
        />
      </div>

      <FormField
        id="contact-message"
        label={`${t('messageLabel')} *`}
        type="text"
        multiline
        placeholder={t('messagePlaceholder')}
        required
        value={fields.message}
        onChange={set('message')}
      />

      {/* Honeypot — visually hidden, off the tab order. Real users never fill it. */}
      <input
        type="text"
        className={styles.honeypot}
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        value={botcheck}
        onChange={(event) => setBotcheck(event.target.value)}
      />

      {error ? (
        <p className={styles.error} role="alert">
          {error}
        </p>
      ) : null}

      <CommonButton type="submit" variant="primary" size="lg" fullWidth disabled={pending}>
        {pending ? t('sending') : t('submit')}
      </CommonButton>

      <p className={styles.consent}>
        {t.rich('consent', {
          privacy: (chunks) => (
            <Link className={styles.consentLink} href="/privacy">
              {chunks}
            </Link>
          ),
        })}
      </p>
    </form>
  )
}
