import {getTranslations} from 'next-intl/server'
import {ItemStep} from '@/components/items/ItemStep'
import styles from './BlockSteps.module.css'

type StepItem = {
  label: string
  title: string
  description: string
}

// "So funktioniert's" — section title plus three numbered steps. Also the
// in-page anchor target for the nav and the hero's secondary CTA.
export async function BlockSteps() {
  const t = await getTranslations('steps')
  const items = t.raw('items') as StepItem[]

  return (
    <section id="how-it-works" className={styles.root} aria-labelledby="steps-title">
      <div className={styles.header}>
        <p className="eyebrow">{t('eyebrow')}</p>
        <h2 id="steps-title" className={styles.title}>
          {t.rich('title', {
            accent: (chunks) => <em className={styles.accent}>{chunks}</em>,
          })}
        </h2>
      </div>

      <ol className={styles.grid}>
        {items.map((item, index) => (
          <ItemStep
            key={index}
            number={index + 1}
            label={item.label}
            title={item.title}
            description={item.description}
          />
        ))}
      </ol>
    </section>
  )
}
