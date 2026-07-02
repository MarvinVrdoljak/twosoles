import {getTranslations} from 'next-intl/server'
import {ItemFaq} from '@/components/items/ItemFaq'
import {Link} from '@/i18n/navigation'
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
        <p className="eyebrow">{t('eyebrow')}</p>
        <h2 id="faq-title" className={styles.title}>
          {t.rich('title', {
            accent: (chunks) => <em className={styles.accent}>{chunks}</em>,
          })}
        </h2>
      </div>

      <div className={styles.body}>
        <div className={styles.accordion}>
          {items.map((item, index) => (
            <ItemFaq key={index} question={item.question} answer={item.answer} />
          ))}
        </div>

        <p className={styles.note}>
          {t.rich('note', {
            support: (chunks) => (
              <Link className={styles.support} href="/contact">
                {chunks}
              </Link>
            ),
          })}
        </p>
      </div>
    </section>
  )
}
