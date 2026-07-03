import {getTranslations, setRequestLocale} from 'next-intl/server'
import {redirect} from 'next/navigation'
import {Trash2} from 'lucide-react'
import {CommonButton} from '@/components/common/CommonButton'
import {CommonPageHeader} from '@/components/common/CommonPageHeader'
import {FormProfile} from '@/components/form/FormProfile'
import {ItemBill} from '@/components/items/ItemBill'
import {LayoutDashboard} from '@/components/layout/LayoutDashboard'
import {getPathname} from '@/i18n/navigation'
import type {Locale} from '@/i18n/routing'
import {getUser} from '@/utility/supabase/user'
import styles from './page.module.css'

type AccountPageProps = {
  params: Promise<{locale: Locale}>
}

// Static placeholder invoices — replaced with real Stripe data later.
const STATIC_BILLS = [
  {title: 'Hochzeit · Sophie & Jonas', meta: '03.05.2026 · «Klassisch»', price: '49,00 €'},
  {title: 'Silberhochzeit · Sophie & Jonas', meta: '03.05.2026 · «Intim»', price: '29,00 €'},
  {title: 'Polterabend · Max & Lisa', meta: '03.05.2026 · Upgrade zu «Große Feier»', price: '30,00 €'},
]

export default async function AccountPage({params}: AccountPageProps) {
  const {locale} = await params
  setRequestLocale(locale)

  const user = await getUser()
  if (!user) {
    redirect(getPathname({href: '/login', locale}))
  }

  const t = await getTranslations('account')

  const rawName: unknown = user.user_metadata?.name
  const name = typeof rawName === 'string' ? rawName : ''
  const email = user.email ?? ''

  return (
    <LayoutDashboard active="account">
      <div className={styles.root}>
        <CommonPageHeader title={t('title')} subtitle={t('subtitle')} />

        <div className={styles.cards}>
          <section className={styles.card}>
            <FormProfile initialName={name} email={email} />
          </section>

          <section className={styles.card}>
            <h2 className={styles.cardTitle}>{t('billingTitle')}</h2>
            <div className={styles.bills}>
              {STATIC_BILLS.map((bill, index) => (
                <ItemBill
                  key={index}
                  title={bill.title}
                  meta={bill.meta}
                  price={bill.price}
                  downloadLabel={t('downloadPdf')}
                />
              ))}
            </div>
          </section>

          <section className={styles.card}>
            <div className={styles.deleteHead}>
              <h2 className={styles.deleteTitle}>{t('deleteTitle')}</h2>
              <p className={styles.deleteText}>{t('deleteText')}</p>
            </div>
            <div className={styles.deleteActions}>
              <CommonButton type="button" variant="danger" size="md">
                <Trash2 size={20} aria-hidden="true" />
                {t('deleteButton')}
              </CommonButton>
            </div>
          </section>
        </div>
      </div>
    </LayoutDashboard>
  )
}
