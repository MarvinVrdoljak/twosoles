import {Fragment} from 'react'
import {getTranslations} from 'next-intl/server'
import {Heart} from 'lucide-react'
import styles from './BlockTicker.module.css'

// Continuously scrolling marquee of example questions. The list is rendered
// twice and the track is translated by -50%, which loops seamlessly. Pure CSS
// animation — pauses on hover and for reduced-motion users.
export async function BlockTicker() {
  const t = await getTranslations('ticker')
  const questions = t.raw('questions') as string[]

  const renderItems = () =>
    questions.map((question, index) => (
      <Fragment key={index}>
        <span className={styles.item}>{question}</span>
        <Heart className={styles.heart} size={14} fill="currentColor" aria-hidden="true" />
      </Fragment>
    ))

  return (
    <section className={styles.root} aria-label={t('ariaLabel')}>
      <div className={styles.track}>
        <span className={styles.set}>{renderItems()}</span>
        <span className={styles.set} aria-hidden="true">
          {renderItems()}
        </span>
      </div>
    </section>
  )
}
