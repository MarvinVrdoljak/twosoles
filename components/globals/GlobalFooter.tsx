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
        <Link className={styles.link} href="/faq">
          {t('faq')}
        </Link>
        <Link className={styles.link} href="/contact">
          {t('contact')}
        </Link>
        <Link className={styles.link} href="/privacy">
          {t('privacy')}
        </Link>
        <Link className={styles.link} href="/terms">
          {t('terms')}
        </Link>
        <Link className={styles.link} href="/imprint">
          {t('imprint')}
        </Link>
      </nav>
    </footer>
  )
}
