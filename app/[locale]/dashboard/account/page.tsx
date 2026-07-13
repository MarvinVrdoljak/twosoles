import {getTranslations, setRequestLocale} from 'next-intl/server'
import {redirect} from 'next/navigation'
import {CommonPageHeader} from '@/components/common/CommonPageHeader'
import {FormDeleteAccount} from '@/components/form/FormDeleteAccount'
import {FormProfile} from '@/components/form/FormProfile'
import {ItemBill} from '@/components/items/ItemBill'
import {LayoutDashboard} from '@/components/layout/LayoutDashboard'
import {getPathname} from '@/i18n/navigation'
import type {Locale} from '@/i18n/routing'
import {getStripe} from '@/utility/stripe/server'
import {createClient} from '@/utility/supabase/server'
import {getUser} from '@/utility/supabase/user'
import styles from './page.module.css'

type AccountPageProps = {
  params: Promise<{locale: Locale}>
}

type Tier = {name: string}

// target_package → pricing.tiers index (display names live in i18n).
const PACKAGE_INDEX: Record<string, number> = {free: 0, small: 1, medium: 2, large: 3}

type PaymentRow = {
  id: string
  event_id: string | null
  target_package: string
  previous_package: string | null
  amount_total: number | null
  currency: string | null
  stripe_payment_intent: string | null
  created_at: string
  // Embedded via the FK; PostgREST returns a single object (or null).
  events: {person1_name: string; person2_name: string} | {person1_name: string; person2_name: string}[] | null
}

// Best-effort Stripe-hosted receipt URL for a payment. Returns null on any
// problem (no key, expired, MoR without a receipt) so the page still renders.
async function receiptUrlFor(paymentIntentId: string | null): Promise<string | null> {
  if (!paymentIntentId) return null
  try {
    const pi = await getStripe().paymentIntents.retrieve(paymentIntentId, {
      expand: ['latest_charge'],
    })
    const charge = pi.latest_charge
    return typeof charge === 'object' && charge ? (charge.receipt_url ?? null) : null
  } catch {
    return null
  }
}

export default async function AccountPage({params}: AccountPageProps) {
  const {locale} = await params
  setRequestLocale(locale)

  const user = await getUser()
  if (!user) {
    redirect(getPathname({href: '/login', locale}))
  }

  const t = await getTranslations('account')
  const tiers = (await getTranslations('pricing')).raw('tiers') as Tier[]

  const rawName: unknown = user.user_metadata?.name
  const name = typeof rawName === 'string' ? rawName : ''
  const email = user.email ?? ''

  // Real purchase history, RLS-scoped to the owner, newest first, with the
  // event title embedded via the FK.
  const supabase = await createClient()
  const {data} = await supabase
    .from('event_payments')
    .select(
      'id, event_id, target_package, previous_package, amount_total, currency, stripe_payment_intent, created_at, events(person1_name, person2_name)',
    )
    .eq('user_id', user.id)
    .order('created_at', {ascending: false})
  const payments = (data ?? []) as PaymentRow[]

  // Receipt links are looked up in parallel; failures degrade to no button.
  const receipts = await Promise.all(payments.map((p) => receiptUrlFor(p.stripe_payment_intent)))

  const dateFormat = new Intl.DateTimeFormat(locale, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
  const money = (cents: number | null, currency: string | null) =>
    new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: (currency ?? 'eur').toUpperCase(),
    }).format((cents ?? 0) / 100)

  const bills = payments.map((p, index) => {
    const tierName = tiers[PACKAGE_INDEX[p.target_package] ?? 0]?.name ?? p.target_package
    const isUpgrade = p.previous_package != null && p.previous_package !== 'free'
    const date = dateFormat.format(new Date(p.created_at))
    const event = Array.isArray(p.events) ? p.events[0] : p.events
    return {
      id: p.id,
      title: event ? `${event.person1_name} & ${event.person2_name}` : t('billDeletedEvent'),
      meta: isUpgrade
        ? t('billUpgradeMeta', {date, package: tierName})
        : t('billPurchaseMeta', {date, package: tierName}),
      price: money(p.amount_total, p.currency),
      receiptUrl: receipts[index],
    }
  })

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
            {bills.length > 0 ? (
              <div className={styles.bills}>
                {bills.map((bill) => (
                  <ItemBill
                    key={bill.id}
                    title={bill.title}
                    meta={bill.meta}
                    price={bill.price}
                    receiptLabel={t('viewReceipt')}
                    receiptUrl={bill.receiptUrl}
                  />
                ))}
              </div>
            ) : (
              <p className={styles.empty}>{t('noBills')}</p>
            )}
          </section>

          <section className={styles.card}>
            <div className={styles.deleteHead}>
              <h2 className={styles.deleteTitle}>{t('deleteTitle')}</h2>
              <p className={styles.deleteText}>{t('deleteText')}</p>
            </div>
            <FormDeleteAccount />
          </section>
        </div>
      </div>
    </LayoutDashboard>
  )
}
