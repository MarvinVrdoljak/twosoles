import {getTranslations} from 'next-intl/server'
import {CommonButton} from '@/components/common/CommonButton'
import {CommonImage} from '@/components/common/CommonImage'
import {CommonReveal} from '@/components/common/CommonReveal'
import {CommonTitleReveal} from '@/components/common/CommonTitleReveal'
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

      <div className={styles.content}>
        <div className={styles.heading}>
          <CommonReveal tag="p" className="eyebrow">
            {t('eyebrow')}
          </CommonReveal>
          <CommonTitleReveal
            tag="h2"
            className={styles.title}
            accentClassName={styles.accent}
            text={t.raw('title') as string}
          />
        </div>
        <CommonReveal tag="p" className={styles.lead} delay={0.1}>
          {t('lead')}
        </CommonReveal>
        <CommonReveal className={styles.actions} delay={0.15}>
          <CommonButton href="/register" variant="primary" size="lg">
            {t('cta')}
          </CommonButton>
        </CommonReveal>
      </div>
    </section>
  )
}
