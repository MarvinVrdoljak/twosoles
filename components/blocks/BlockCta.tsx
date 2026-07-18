import {getTranslations} from 'next-intl/server'
import {CommonButton} from '@/components/common/CommonButton'
import {CommonImage} from '@/components/common/CommonImage'
import {CommonReveal} from '@/components/common/CommonReveal'
import styles from './BlockCta.module.css'

// Closing call-to-action: photo beside a headline + sign-up button.
export async function BlockCta() {
  const t = await getTranslations('cta')

  return (
    <section className={styles.root}>
      <CommonReveal className={styles.media} y={0}>
        <CommonImage
          className={styles.image}
          src="/images/twosoles-wedding-game-teaser.jpg"
          alt={t('imageAlt')}
          fill
          sizes="(max-width: 1024px) 100vw, 50vw"
        />
      </CommonReveal>

      <CommonReveal className={styles.content} delay={0.1}>
        <div className={styles.heading}>
          <p className="eyebrow">{t('eyebrow')}</p>
          <h2 className={styles.title}>
            {t.rich('title', {
              accent: (chunks) => <em className={styles.accent}>{chunks}</em>,
            })}
          </h2>
        </div>
        <p className={styles.lead}>{t('lead')}</p>
        <div className={styles.actions}>
          <CommonButton href="/register" variant="primary" size="lg">
            {t('cta')}
          </CommonButton>
        </div>
      </CommonReveal>
    </section>
  )
}
