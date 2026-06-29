'use client'

import {useState} from 'react'
import {hasLocale, useLocale, useTranslations} from 'next-intl'
import {Menu, X} from 'lucide-react'
import {CommonButton} from '@/components/common/CommonButton'
import {CommonSelect} from '@/components/common/CommonSelect'
import {Link, usePathname, useRouter} from '@/i18n/navigation'
import {routing} from '@/i18n/routing'
import styles from './GlobalHeader.module.css'

const NAV_LINKS = [
  {key: 'howItWorks', href: '#so-funktionierts'},
  {key: 'pricing', href: '#preise'},
  {key: 'testimonials', href: '#stimmen'},
  {key: 'faq', href: '#faq'},
] as const

// Marketing site header. Desktop shows the full nav (links, language, Login,
// sign-up CTA). Below the large breakpoint it collapses to Login + a hamburger
// that opens a drawer with the navigation, language switch and both CTAs.
export function GlobalHeader() {
  const t = useTranslations('nav')
  const router = useRouter()
  const pathname = usePathname()
  const locale = useLocale()
  const [open, setOpen] = useState(false)

  const switchLocale = (next: string) => {
    if (next !== locale && hasLocale(routing.locales, next)) {
      router.replace(pathname, {locale: next})
    }
  }

  // Full, localized language names in the list; compact code on the trigger.
  const languageOptions = routing.locales.map((code) => ({
    value: code,
    label: t(`languageNames.${code}`),
  }))

  return (
    <header className={styles.root}>
      <div className={styles.bar}>
        <div className={styles.left}>
          <Link href="/" className={styles.logo} onClick={() => setOpen(false)}>
            TwoSoles
          </Link>

          <nav className={styles.navDesktop} aria-label={t('ariaPrimary')}>
            {NAV_LINKS.map((link) => (
              <a key={link.key} className={styles.navLink} href={link.href}>
                {t(link.key)}
              </a>
            ))}
          </nav>
        </div>

        <div className={styles.right}>
          <span className={styles.langDesktop}>
            <CommonSelect
              options={languageOptions}
              value={locale}
              onChange={switchLocale}
              triggerLabel={locale.toUpperCase()}
              ariaLabel={t('selectLanguage')}
            />
          </span>

          <CommonButton href="/login" variant="secondary" size="md">
            {t('login')}
          </CommonButton>

          <span className={styles.ctaDesktop}>
            <CommonButton href="/register" variant="primary" size="md">
              {t('ctaStart')}
            </CommonButton>
          </span>

          <button
            type="button"
            className={styles.hamburger}
            aria-label={open ? t('menuClose') : t('menuOpen')}
            aria-expanded={open}
            aria-controls="mobile-menu"
            onClick={() => setOpen((value) => !value)}
          >
            {open ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      <div
        className={`${styles.drawer}${open ? ` ${styles.drawerOpen}` : ''}`}
        id="mobile-menu"
        inert={!open}
      >
        <nav className={styles.drawerNav} aria-label={t('ariaPrimary')}>
          {NAV_LINKS.map((link) => (
            <a
              key={link.key}
              className={styles.drawerLink}
              href={link.href}
              onClick={() => setOpen(false)}
            >
              {t(link.key)}
            </a>
          ))}
        </nav>

        <div className={styles.langDrawer}>
          <CommonSelect
            options={languageOptions}
            value={locale}
            onChange={switchLocale}
            triggerLabel={locale.toUpperCase()}
            ariaLabel={t('selectLanguage')}
          />
        </div>

        <div className={styles.drawerActions}>
          <CommonButton href="/login" variant="secondary" size="md" fullWidth>
            {t('login')}
          </CommonButton>
          <CommonButton href="/register" variant="primary" size="md" fullWidth>
            {t('ctaStartMenu')}
          </CommonButton>
        </div>
      </div>
    </header>
  )
}
