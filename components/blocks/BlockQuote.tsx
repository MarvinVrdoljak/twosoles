import {getTranslations} from 'next-intl/server'
import {CommonReveal} from '@/components/common/CommonReveal'
import styles from './BlockQuote.module.css'

// Large centered pull-quote on the page (cream) background.
export async function BlockQuote() {
  const t = await getTranslations('quote')

  return (
    <section className={styles.root}>
      <CommonReveal tag="blockquote" className={styles.quote}>
        <p className={styles.text}>
          {t.rich('text', {
            accent: (chunks) => <span className={styles.accent}>{chunks}</span>,
          })}
        </p>
      </CommonReveal>
    </section>
  )
}
