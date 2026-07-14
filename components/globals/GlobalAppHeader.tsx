import {getTranslations} from 'next-intl/server'
import {CommonLogo} from '@/components/common/CommonLogo'
import {GlobalUserMenu} from '@/components/globals/GlobalUserMenu'
import {Link} from '@/i18n/navigation'
import styles from './GlobalAppHeader.module.css'

type GlobalAppHeaderProps = {
  active?: 'events' | 'account'
}

// Header for the signed-in app area: logo, section nav and the account menu.
// `active` is optional — pages without a matching nav item (e.g. legal pages)
// simply highlight nothing.
export async function GlobalAppHeader({active}: GlobalAppHeaderProps) {
  const t = await getTranslations('dashboard')

  return (
    <header className={styles.root}>
      <div className={styles.left}>
        <Link href="/dashboard" className={styles.logo}>
          <CommonLogo className={styles.logoImg} />
        </Link>
        <nav className={styles.nav} aria-label={t('navLabel')}>
          <Link
            href="/dashboard"
            className={`${styles.navLink} ${active === 'events' ? styles.active : ''}`}
          >
            {t('navEvents')}
          </Link>
          <Link
            href="/dashboard/account"
            className={`${styles.navLink} ${active === 'account' ? styles.active : ''}`}
          >
            {t('navAccount')}
          </Link>
        </nav>
      </div>

      <GlobalUserMenu />
    </header>
  )
}
