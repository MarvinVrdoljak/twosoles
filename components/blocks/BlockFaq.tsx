import {getTranslations} from 'next-intl/server'
import {CommonButton} from '@/components/common/CommonButton'
import {CommonReveal} from '@/components/common/CommonReveal'
import {CommonTitleReveal} from '@/components/common/CommonTitleReveal'
import {ItemFaq} from '@/components/items/ItemFaq'
import styles from './BlockFaq.module.css'

type FaqItem = {
  question: string
  answer: string
}

// "Kurz beantwortet" — FAQ accordion. In-page anchor target for the nav.
export async function BlockFaq() {
  const t = await getTranslations('faq')
  const items = t.raw('items') as FaqItem[]

  return (
    <section id="faq" className={styles.root} aria-labelledby="faq-title">
      <div className={styles.header}>
        <CommonReveal tag="p" className="eyebrow">
          {t('eyebrow')}
        </CommonReveal>
        <CommonTitleReveal
          tag="h2"
          id="faq-title"
          className={styles.title}
          accentClassName={styles.accent}
          text={t.raw('title') as string}
        />
      </div>

      <CommonReveal className={styles.body} delay={0.1}>
        <div className={styles.accordion}>
          {items.map((item, index) => (
            <ItemFaq key={index} question={item.question} answer={item.answer} />
          ))}
        </div>

        <div className={styles.actions}>
          <CommonButton href="/faq" variant="primary" size="md">
            {t('allCta')}
          </CommonButton>
        </div>
      </CommonReveal>
    </section>
  )
}
