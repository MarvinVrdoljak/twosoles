import React from 'react'
import {CommonImage} from '@/components/common/CommonImage'
import {Link} from '@/i18n/navigation'
import styles from './LayoutAuth.module.css'

type LayoutAuthProps = {
  title: string
  subtitle?: string
  error?: string
  footer: {text: string; linkLabel: string; href: string}
  children: React.ReactNode
}

// Split auth shell: a mood image on the left (hidden on mobile) and a centered
// form column on the right. The page passes the form pieces as children.
export function LayoutAuth({title, subtitle, error, footer, children}: LayoutAuthProps) {
  return (
    <div className={styles.root}>
      <div className={styles.media}>
        <CommonImage
          className={styles.image}
          src="/images/hero-couple.jpg"
          alt=""
          fill
          priority
          sizes="(max-width: 1024px) 0px, 50vw"
        />
      </div>

      <main className={styles.content}>
        <div className={styles.inner}>
          <Link href="/" className={styles.logo}>
            TwoSoles
          </Link>

          <div className={styles.head}>
            <h1 className={styles.title}>{title}</h1>
            {subtitle ? <p className={styles.subtitle}>{subtitle}</p> : null}
          </div>

          {error ? (
            <p className={styles.error} role="alert">
              {error}
            </p>
          ) : null}

          {children}

          <p className={styles.footer}>
            {footer.text}{' '}
            <Link href={footer.href} className={styles.footerLink}>
              {footer.linkLabel}
            </Link>
          </p>
        </div>
      </main>
    </div>
  )
}
