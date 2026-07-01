import {getTranslations} from 'next-intl/server'
import {CommonButton} from '@/components/common/CommonButton'
import {CommonImage} from '@/components/common/CommonImage'
import styles from './BlockHero.module.css'

// Landing hero: eyebrow, headline with an italic accent, lead text, two CTAs and
// an arched photo. Decorative shoe line-art sits behind the content on desktop.
export async function BlockHero() {
  const t = await getTranslations('hero')

  return (
    <section className={styles.root}>
      <img className={styles.decorLeft} src="/images/decor-shoe-left.svg" alt="" aria-hidden="true" />
      <img className={styles.decorRight} src="/images/decor-shoe-right.svg" alt="" aria-hidden="true" />

      <div className={styles.inner}>
        <div className={styles.content}>
          <p className="eyebrow">{t('eyebrow')}</p>
          <h1 className={styles.headline}>
            {t.rich('headline', {
              accent: (chunks) => <em className={styles.accent}>{chunks}</em>,
            })}
          </h1>
          <p className={styles.lead}>{t('lead')}</p>
          <div className={styles.actions}>
            <CommonButton href="/register" variant="primary" size="lg">
              {t('ctaPrimary')}
            </CommonButton>
            <CommonButton href="#how-it-works" variant="secondary" size="lg">
              {t('ctaSecondary')}
            </CommonButton>
          </div>
        </div>

        <div className={styles.media}>
          <CommonImage
            className={styles.image}
            src="/images/hero-couple.jpg"
            alt={t('imageAlt')}
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 40vw"
          />
        </div>
      </div>
    </section>
  )
}
