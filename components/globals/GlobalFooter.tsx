import {getTranslations} from 'next-intl/server'
import {Link} from '@/i18n/navigation'
import styles from './GlobalFooter.module.css'

// Site footer: copyright + legal links. Primary-coloured bar.
export async function GlobalFooter() {
  const t = await getTranslations('footer')

  return (
    <footer className={styles.root}>
      <p className={styles.copy}>{t('copyright')}</p>
      <nav className={styles.links} aria-label={t('legalNav')}>
        <Link className={styles.link} href="/datenschutz">
          {t('privacy')}
        </Link>
        <Link className={styles.link} href="/agb">
          {t('terms')}
        </Link>
        <Link className={styles.link} href="/impressum">
          {t('imprint')}
        </Link>
      </nav>
    </footer>
  )
}
