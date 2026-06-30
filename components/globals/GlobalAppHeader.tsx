import {getTranslations} from 'next-intl/server'
import {GlobalUserMenu} from '@/components/globals/GlobalUserMenu'
import {Link} from '@/i18n/navigation'
import styles from './GlobalAppHeader.module.css'

type GlobalAppHeaderProps = {
  active?: 'events' | 'konto'
}

// Header for the signed-in app area: logo, section nav and the account menu.
export async function GlobalAppHeader({active = 'events'}: GlobalAppHeaderProps) {
  const t = await getTranslations('dashboard')

  return (
    <header className={styles.root}>
      <div className={styles.left}>
        <Link href="/host" className={styles.logo}>
          TwoSoles
        </Link>
        <nav className={styles.nav} aria-label={t('navLabel')}>
          <Link
            href="/host"
            className={`${styles.navLink} ${active === 'events' ? styles.active : ''}`}
          >
            {t('navEvents')}
          </Link>
          <Link
            href="/host/konto"
            className={`${styles.navLink} ${active === 'konto' ? styles.active : ''}`}
          >
            {t('navAccount')}
          </Link>
        </nav>
      </div>

      <GlobalUserMenu />
    </header>
  )
}
