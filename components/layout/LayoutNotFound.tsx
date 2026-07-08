import {getTranslations} from 'next-intl/server'
import {Heart} from 'lucide-react'
import {CommonButton} from '@/components/common/CommonButton'
import {GlobalAppHeader} from '@/components/globals/GlobalAppHeader'
import {GlobalFooter} from '@/components/globals/GlobalFooter'
import {GlobalHeader} from '@/components/globals/GlobalHeader'
import {Link} from '@/i18n/navigation'
import {getUser} from '@/utility/supabase/user'
import styles from './LayoutNotFound.module.css'

// Shared 404 shell. Like the legal pages, it swaps the chrome to match the
// visitor's state: the app header (with the account menu) when signed in, the
// marketing header otherwise. The primary actions differ accordingly — a
// signed-in user is pointed back into the app, a visitor to the landing page.
export async function LayoutNotFound() {
  const t = await getTranslations('notFound')
  const user = await getUser()

  return (
    <>
      {user ? <GlobalAppHeader /> : <GlobalHeader />}
      <main className={styles.root}>
        <div className={styles.inner}>
          <p className={styles.eyebrow}>{t('eyebrow')}</p>

          {/* Decorative "404" — the two zeros become a pair of hearts (two
              souls). Hidden from assistive tech; the eyebrow conveys the code. */}
          <div className={styles.code} aria-hidden="true">
            <span>4</span>
            <span className={styles.hearts}>
              <Heart className={`${styles.heart} ${styles.heartBack}`} />
              <Heart className={styles.heart} />
            </span>
            <span>4</span>
          </div>

          <h1 className={styles.title}>{t('title')}</h1>
          <p className={styles.body}>{t('body')}</p>

          <div className={styles.actions}>
            {user ? (
              <>
                <CommonButton href="/dashboard" variant="primary" size="lg">
                  {t('dashboardCta')}
                </CommonButton>
                <CommonButton href="/dashboard/account" variant="secondary" size="lg">
                  {t('accountCta')}
                </CommonButton>
              </>
            ) : (
              <>
                <CommonButton href="/" variant="primary" size="lg">
                  {t('homeCta')}
                </CommonButton>
                <CommonButton href="/login" variant="secondary" size="lg">
                  {t('loginCta')}
                </CommonButton>
              </>
            )}
          </div>

          <p className={styles.help}>
            {t('helpText')}{' '}
            <Link className={styles.helpLink} href="/contact">
              {t('helpLink')}
            </Link>
          </p>
        </div>
      </main>
      <GlobalFooter />
    </>
  )
}
