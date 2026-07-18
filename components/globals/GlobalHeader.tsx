'use client'

import {useState, type MouseEvent} from 'react'
import {hasLocale, useLocale, useTranslations} from 'next-intl'
import {Menu, X} from 'lucide-react'
import {CommonButton} from '@/components/common/CommonButton'
import {CommonLogo} from '@/components/common/CommonLogo'
import {CommonSelect} from '@/components/common/CommonSelect'
import {Link, usePathname, useRouter} from '@/i18n/navigation'
import {routing} from '@/i18n/routing'
import styles from './GlobalHeader.module.css'

// Full paths (not bare fragments) so the anchors also work from subpages like
// /impressum — clicking jumps back to the home page and scrolls to the target.
const NAV_LINKS = [
  {key: 'howItWorks', href: '/#how-it-works'},
  {key: 'pricing', href: '/#pricing'},
  {key: 'testimonials', href: '/#voices'},
  {key: 'faq', href: '/#faq'},
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

  // On the home page, scroll to the section smoothly instead of letting the
  // Link jump. From any other page we let the Link navigate — it lands on the
  // home page and jumps straight to the anchor (no smooth animation).
  const handleNavClick = (event: MouseEvent<HTMLAnchorElement>, href: string) => {
    setOpen(false)
    if (pathname !== '/') return
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
    const id = href.split('#')[1]
    const target = id ? document.getElementById(id) : null
    if (!target) return
    event.preventDefault()
    target.scrollIntoView({behavior: 'smooth'})
    window.history.replaceState(null, '', `#${id}`)
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
            <CommonLogo className={styles.logoImg} />
          </Link>

          <nav className={styles.navDesktop} aria-label={t('ariaPrimary')}>
            {NAV_LINKS.map((link) => (
              <Link
                key={link.key}
                className={styles.navLink}
                href={link.href}
                onClick={(event) => handleNavClick(event, link.href)}
              >
                {t(link.key)}
              </Link>
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

          <span className={styles.loginDesktop}>
            <CommonButton href="/login" variant="secondary" size="md">
              {t('login')}
            </CommonButton>
          </span>

          <span className={styles.ctaDesktop}>
            <CommonButton href="/register" variant="primary" size="md">
              {t('ctaStart')}
            </CommonButton>
          </span>

          <span className={styles.ctaMobile}>
            <CommonButton href="/register" variant="primary" size="sm">
              {t('ctaStartShort')}
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
            <Link
              key={link.key}
              className={styles.drawerLink}
              href={link.href}
              onClick={(event) => handleNavClick(event, link.href)}
            >
              {t(link.key)}
            </Link>
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
