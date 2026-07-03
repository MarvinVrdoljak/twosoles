'use client'

import {useEffect, useRef, useState} from 'react'
import {hasLocale, useLocale, useTranslations} from 'next-intl'
import {LogOut, User} from 'lucide-react'
import {CommonSelect} from '@/components/common/CommonSelect'
import {Link, usePathname, useRouter} from '@/i18n/navigation'
import {routing} from '@/i18n/routing'
import {signOutAction} from '@/utility/auth/actions'
import styles from './GlobalUserMenu.module.css'

// Circular avatar button that opens a small account menu: account link, a plain
// (cookie/URL-based) language switch and sign out.
export function GlobalUserMenu() {
  const t = useTranslations('dashboard')
  const tNav = useTranslations('nav')
  const router = useRouter()
  const pathname = usePathname()
  const locale = useLocale()
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const switchLocale = (next: string) => {
    if (next !== locale && hasLocale(routing.locales, next)) {
      router.replace(pathname, {locale: next})
      setOpen(false)
    }
  }

  // Full, localized language names in the list; compact code on the trigger.
  const languageOptions = routing.locales.map((code) => ({
    value: code,
    label: tNav(`languageNames.${code}`),
  }))

  return (
    <div className={styles.root} ref={rootRef}>
      <button
        type="button"
        className={styles.trigger}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={t('userMenu')}
        onClick={() => setOpen((value) => !value)}
      >
        <User size={20} aria-hidden="true" />
      </button>

      <div className={`${styles.menu} ${open ? styles.menuOpen : ''}`} role="menu">
        <Link href="/dashboard/account" className={styles.item} role="menuitem" onClick={() => setOpen(false)}>
          <User size={16} aria-hidden="true" />
          {t('account')}
        </Link>

        <div className={styles.language}>
          <span className={styles.languageLabel}>{t('language')}</span>
          <CommonSelect
            options={languageOptions}
            value={locale}
            onChange={switchLocale}
            triggerLabel={locale.toUpperCase()}
            ariaLabel={tNav('selectLanguage')}
          />
        </div>

        <form action={signOutAction}>
          <button type="submit" className={styles.item} role="menuitem">
            <LogOut size={16} aria-hidden="true" />
            {t('logout')}
          </button>
        </form>
      </div>
    </div>
  )
}
