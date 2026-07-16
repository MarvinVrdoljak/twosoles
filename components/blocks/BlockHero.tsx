import {getTranslations} from 'next-intl/server'
import {CommonButton} from '@/components/common/CommonButton'
import {CommonImage} from '@/components/common/CommonImage'
import {BlockHeroVoting} from './BlockHeroVoting'
import styles from './BlockHero.module.css'
import Leaf01 from '@/public/images/leaf_01.svg'
import Leaf02 from '@/public/images/leaf_02.svg'
import Leaf03 from '@/public/images/leaf_03.svg'

export async function BlockHero() {
  const t = await getTranslations('hero')

  return (
    <section className={styles.root}>
      <Leaf02 className={styles.leafLeft} aria-hidden="true" />
      <Leaf03 className={styles.leafRight} aria-hidden="true" />
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

        <div className={styles.mediaWrapper}>
          <Leaf01 className={styles.leafMiddle} aria-hidden="true" />
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
          <BlockHeroVoting />
        </div>
      </div>
    </section>
  )
}
