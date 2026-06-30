'use client'

import {useEffect, useRef, useState} from 'react'
import {useTranslations} from 'next-intl'
import {LogOut, User} from 'lucide-react'
import {Link} from '@/i18n/navigation'
import {signOutAction} from '@/utility/auth/actions'
import styles from './GlobalUserMenu.module.css'

// Circular avatar button that opens a small account menu (account + sign out).
export function GlobalUserMenu() {
  const t = useTranslations('dashboard')
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
        <Link href="/host/konto" className={styles.item} role="menuitem" onClick={() => setOpen(false)}>
          <User size={16} aria-hidden="true" />
          {t('account')}
        </Link>
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
