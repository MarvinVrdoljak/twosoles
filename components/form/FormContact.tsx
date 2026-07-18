'use client'

import {useState, useTransition} from 'react'
import {useTranslations} from 'next-intl'
import {MailCheck} from 'lucide-react'
import {CommonButton} from '@/components/common/CommonButton'
import {useToast} from '@/components/common/CommonToast'
import {CommonSelect, type SelectOption} from '@/components/common/CommonSelect'
import {FormField} from '@/components/form/FormField'
import {Link} from '@/i18n/navigation'
import {sendContactMessage} from '@/utility/contact/actions'
import {CONTACT_SUBJECTS, type ContactSubject} from '@/utility/contact/subjects'
import styles from './FormContact.module.css'

type SubjectKey = ContactSubject

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

export function FormContact() {
  const t = useTranslations('contact.form')
  const {toast} = useToast()
  const [subject, setSubject] = useState<SubjectKey | ''>('')
  const [fields, setFields] = useState<Fields>(EMPTY)
  const [botcheck, setBotcheck] = useState('')
  const [sent, setSent] = useState(false)
  const [pending, startTransition] = useTransition()

  const subjectOptions: SelectOption[] = CONTACT_SUBJECTS.map((key) => ({
    value: key,
    label: t(`subjects.${key}`),
  }))

  const set = (key: keyof Fields) => (value: string) =>
    setFields((prev) => ({...prev, [key]: value}))

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!subject) {
      toast(t('errors.subject'))
      return
    }

    startTransition(async () => {
      // The email is sent from a server action — the Resend secret key never
      // reaches the browser. Field validation and the honeypot are re-checked
      // there too; this client copy is just for fast feedback.
      const result = await sendContactMessage({subject, ...fields, botcheck})
      if (result.ok) {
        setSent(true)
        return
      }
      toast(t('errors.failed'))
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
          placeholder={t('weddingDatePlaceholder')}
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
