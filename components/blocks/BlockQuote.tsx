import {getTranslations} from 'next-intl/server'
import {CommonTitleReveal} from '@/components/common/CommonTitleReveal'
import styles from './BlockQuote.module.css'

// Large centered pull-quote on the page (cream) background.
export async function BlockQuote() {
  const t = await getTranslations('quote')

  return (
    <section className={styles.root}>
      <blockquote className={styles.quote}>
        <CommonTitleReveal
          tag="p"
          className={styles.text}
          accentClassName={styles.accent}
          text={t.raw('text') as string}
        />
      </blockquote>
    </section>
  )
}
