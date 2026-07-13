'use client'

import {useState, useTransition} from 'react'
import {useTranslations} from 'next-intl'
import {Trash2} from 'lucide-react'
import {CommonButton} from '@/components/common/CommonButton'
import {CommonModal} from '@/components/common/CommonModal'
import {useToast} from '@/components/common/CommonToast'
import {deleteAccountAction} from '@/utility/auth/actions'
import styles from './FormDeleteAccount.module.css'

// Danger action for the account page: opens a confirm dialog, then calls the
// server action. On success the action redirects away; only a failure returns
// here, which we surface inline.
export function FormDeleteAccount() {
  const t = useTranslations('account')
  const {toast} = useToast()
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()

  const close = () => {
    if (pending) return
    setOpen(false)
  }

  const confirm = () => {
    startTransition(async () => {
      const result = await deleteAccountAction()
      if (result?.error) toast(t('deleteError'))
    })
  }

  return (
    <>
      <div className={styles.actions}>
        <CommonButton type="button" variant="danger" size="md" onClick={() => setOpen(true)}>
          <Trash2 size={20} aria-hidden="true" />
          {t('deleteButton')}
        </CommonButton>
      </div>

      <CommonModal
        open={open}
        onClose={close}
        title={t('deleteConfirmTitle')}
        closeLabel={t('deleteCancel')}
      >
        <div className={styles.confirm}>
          <p className={styles.text}>{t('deleteConfirmText')}</p>
          <div className={styles.confirmActions}>
            <CommonButton variant="secondary" size="md" onClick={close} disabled={pending}>
              {t('deleteCancel')}
            </CommonButton>
            <CommonButton type="button" variant="danger" size="md" onClick={confirm} disabled={pending}>
              {pending ? t('deleting') : t('deleteConfirm')}
            </CommonButton>
          </div>
        </div>
      </CommonModal>
    </>
  )
}
