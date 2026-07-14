import React from 'react'
import {getTranslations} from 'next-intl/server'
import {ArrowLeft} from 'lucide-react'
import {CommonImage} from '@/components/common/CommonImage'
import {CommonLogo} from '@/components/common/CommonLogo'
import {Link} from '@/i18n/navigation'
import styles from './LayoutAuth.module.css'
import Leaf03 from '@/public/images/leaf_03.svg'
import Leaf02 from '@/public/images/leaf_02.svg'

type LayoutAuthProps = {
  eyebrow: string
  title: string
  subtitle: string
  toggle: {text: string; linkLabel: string; href: string}
  children: React.ReactNode
}

// Split auth shell: a photo with a testimonial overlay on the left (hidden on
// mobile) and the form column on the right.
export async function LayoutAuth({
  eyebrow,
  title,
  subtitle,
  toggle,
  children,
}: LayoutAuthProps) {
  const t = await getTranslations('auth')

  return (
    <div className={styles.root}>
      <aside className={styles.media}>
        <CommonImage
          className={styles.image}
          src="/images/auth-couple.jpg"
          alt=""
          fill
          priority
          sizes="(max-width: 1024px) 0px, 58vw"
        />
        <div className={styles.overlay} />
        <div className={styles.mediaContent}>
          <Link href="/" className={styles.logoWhite}>
            <CommonLogo className={styles.logoSvg} />
          </Link>
          <figure className={styles.testimonial}>
            <blockquote className={styles.quote}>{t('testimonialQuote')}</blockquote>
            <figcaption className={styles.figcaption}>
              <span className={styles.author}>{t('testimonialName')}</span>
              <span className={styles.role}>{t('testimonialRole')}</span>
            </figcaption>
          </figure>
        </div>
      </aside>

      <main className={styles.content}>
        <Leaf03 className={styles.leafLeft} aria-hidden="true" />
        <Leaf02 className={styles.leafRight} aria-hidden="true" />
        <div className={styles.inner}>
          <div className={styles.top}>
            <Link href="/" className={styles.logoMobile}>
              <CommonLogo className={styles.logoSvg} />
            </Link>
            <Link href="/" className={styles.back}>
              <ArrowLeft size={16} aria-hidden="true" />
              {t('backToHome')}
            </Link>
          </div>

          <div className={styles.formBlock}>
            <div className={styles.head}>
              <p className="eyebrow eyebrowSmall">{eyebrow}</p>
              <h1 className={styles.title}>{title}</h1>
              <p className={styles.subtitle}>{subtitle}</p>
            </div>

            {children}

            <p className={styles.toggle}>
              {toggle.text}{' '}
              <Link href={toggle.href} className={styles.toggleLink}>
                {toggle.linkLabel}
              </Link>
            </p>
          </div>

          <p className={styles.legal}>
            {t.rich('legalNote', {
              agb: (chunks) => (
                <Link href="/terms" className={styles.legalLink}>
                  {chunks}
                </Link>
              ),
              privacy: (chunks) => (
                <Link href="/privacy" className={styles.legalLink}>
                  {chunks}
                </Link>
              ),
            })}
          </p>
        </div>
      </main>
    </div>
  )
}
