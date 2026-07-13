'use client'

import React, {createContext, useCallback, useContext, useEffect, useRef, useState} from 'react'
import {createPortal} from 'react-dom'
import {useTranslations} from 'next-intl'
import {Check, Info, TriangleAlert, X} from 'lucide-react'
import styles from './CommonToast.module.css'

export type ToastType = 'success' | 'error' | 'info'

type Toast = {id: number; text: string; type: ToastType}

type ToastContextValue = {
  // Show a dismissible toast. Defaults to an error, since most call sites report
  // failures; success/info pass their type explicitly.
  toast: (text: string, type?: ToastType) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

// Toasts auto-dismiss after this long; they can also be closed by hand.
const AUTO_DISMISS_MS = 6000

// Hook for any client component under <ToastProvider> to raise a toast.
export function useToast(): ToastContextValue {
  const context = useContext(ToastContext)
  if (!context) throw new Error('useToast must be used within a ToastProvider')
  return context
}

// App-wide toast host. Mounted once near the root so every screen shares one
// stack of floating, dismissible notifications instead of inline message strips.
export function ToastProvider({children}: {children: React.ReactNode}) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const idRef = useRef(0)
  const timers = useRef(new Map<number, ReturnType<typeof setTimeout>>())

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((entry) => entry.id !== id))
    const timer = timers.current.get(id)
    if (timer) {
      clearTimeout(timer)
      timers.current.delete(id)
    }
  }, [])

  const toast = useCallback(
    (text: string, type: ToastType = 'error') => {
      const id = (idRef.current += 1)
      setToasts((current) => [...current, {id, text, type}])
      timers.current.set(id, setTimeout(() => dismiss(id), AUTO_DISMISS_MS))
    },
    [dismiss],
  )

  return (
    <ToastContext.Provider value={{toast}}>
      {children}
      <Toaster toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  )
}

const ICONS: Record<ToastType, typeof Check> = {
  success: Check,
  error: TriangleAlert,
  info: Info,
}

function Toaster({toasts, onDismiss}: {toasts: Toast[]; onDismiss: (id: number) => void}) {
  const t = useTranslations('general')
  // Portal only after mount: the server renders nothing here, so portalling on
  // the client's first render would mismatch the SSR HTML and break hydration.
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  // Rendered into <body> so toasts escape any stacking/theme context and always
  // sit above modals (which use z-index 200; the viewport uses more).
  if (!mounted || typeof document === 'undefined') return null

  return createPortal(
    <div className={styles.viewport} role="region" aria-live="polite" aria-label={t('notifications')}>
      {toasts.map((toast) => {
        const Icon = ICONS[toast.type]
        return (
          <div
            key={toast.id}
            className={`${styles.toast} ${styles[toast.type]}`}
            role={toast.type === 'error' ? 'alert' : 'status'}
          >
            <span className={styles.icon}>
              <Icon size={18} aria-hidden="true" />
            </span>
            <p className={styles.text}>{toast.text}</p>
            <button
              type="button"
              className={styles.close}
              onClick={() => onDismiss(toast.id)}
              aria-label={t('dismiss')}
            >
              <X size={16} aria-hidden="true" />
            </button>
          </div>
        )
      })}
    </div>,
    document.body,
  )
}
