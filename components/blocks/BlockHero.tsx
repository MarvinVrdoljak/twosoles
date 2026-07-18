import type {CSSProperties, ReactNode} from 'react'
import {getTranslations} from 'next-intl/server'
import {CommonButton} from '@/components/common/CommonButton'
import {CommonImage} from '@/components/common/CommonImage'
import {BlockHeroVoting} from './BlockHeroVoting'
import styles from './BlockHero.module.css'
import Leaf01 from '@/public/images/leaf_01.svg'
import Leaf02 from '@/public/images/leaf_02.svg'
import Leaf03 from '@/public/images/leaf_03.svg'

// Word-by-word headline reveal: split the raw headline (incl. <accent> markup)
// into words, each masked in its own span with a staggered animation delay.
// Rendering happens on the server, the animation is pure CSS — reduced-motion
// users simply see the static headline.
function splitHeadline(headline: string) {
  const nodes: ReactNode[] = []
  let wordIndex = 0

  const pushWords = (text: string, accent: boolean) => {
    for (const word of text.split(' ').filter(Boolean)) {
      const delay = 0.35 + wordIndex * 0.06
      nodes.push(
        <span key={wordIndex} className={styles.word}>
          <span
            className={styles.wordInner}
            style={{'--wd': `${delay.toFixed(2)}s`} as CSSProperties}
          >
            {accent ? <em className={styles.accent}>{word}</em> : word}
          </span>
        </span>,
        ' ',
      )
      wordIndex += 1
    }
  }

  for (const part of headline.split(/(<accent>.*?<\/accent>)/)) {
    const accentMatch = part.match(/^<accent>(.*?)<\/accent>$/)
    if (accentMatch) {
      pushWords(accentMatch[1], true)
    } else {
      pushWords(part, false)
    }
  }

  return nodes
}

export async function BlockHero() {
  const t = await getTranslations('hero')

  return (
    <section className={styles.root}>
      <Leaf02 className={styles.leafLeft} aria-hidden="true" />
      <Leaf03 className={styles.leafRight} aria-hidden="true" />
      <div className={styles.inner}>
        <div className={styles.content}>
          <p className="eyebrow">{t('eyebrow')}</p>
          <h1 className={styles.headline}>{splitHeadline(t.raw('headline') as string)}</h1>
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
              src="/images/twosoles-wedding-game-hero.jpg"
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
