'use client'

import {useState, useTransition} from 'react'
import {useTranslations} from 'next-intl'
import {CommonButton} from '@/components/common/CommonButton'
import {useToast} from '@/components/common/CommonToast'
import {FormField} from '@/components/form/FormField'
import {updateProfileAction} from '@/utility/auth/actions'
import styles from './FormProfile.module.css'

type FormProfileProps = {
  initialName: string
  email: string
}

// Account profile form: editable name only. Email is read-only (tied to the
// login). Saving runs a server action so the SSR session stays intact.
export function FormProfile({initialName, email}: FormProfileProps) {
  const t = useTranslations('account')
  const {toast} = useToast()

  const [name, setName] = useState(initialName)
  const [pending, startTransition] = useTransition()

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    startTransition(async () => {
      const result = await updateProfileAction(name)
      // On success the action redirects; a returned value means it failed.
      if (result?.error) {
        toast(result.error)
      }
    })
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <h2 className={styles.title}>{t('profileTitle')}</h2>

      <div className={styles.fields}>
        <FormField
          id="profile-name"
          name="name"
          label={t('nameLabel')}
          type="text"
          autoComplete="name"
          value={name}
          onChange={setName}
        />

        <FormField
          id="profile-email"
          label={t('emailLabel')}
          type="email"
          value={email}
          onChange={() => {}}
          disabled
          hint={t('emailHint')}
        />
      </div>

      <CommonButton type="submit" variant="primary" size="md" disabled={pending}>
        {pending ? t('saving') : t('save')}
      </CommonButton>
    </form>
  )
}
