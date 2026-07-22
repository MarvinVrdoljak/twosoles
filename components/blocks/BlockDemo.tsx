import {getTranslations} from 'next-intl/server'
import {CommonReveal} from '@/components/common/CommonReveal'
import {CommonTitleReveal} from '@/components/common/CommonTitleReveal'
import {BlockDemoPlayer} from './BlockDemoPlayer'
import styles from './BlockDemo.module.css'

// Abstract, self-playing preview of a live round. Carries the "So funktioniert's"
// eyebrow and the #how-it-works nav/CTA anchor, sitting above the three numbered
// steps. Purely a marketing showcase (not the real game): the interactive,
// looping part lives in the client BlockDemoPlayer. Drop this section from
// app/[locale]/page.tsx to hide the demo entirely.
export async function BlockDemo() {
  const t = await getTranslations('demo')

  return (
    <section id="how-it-works" className={styles.root} aria-labelledby="demo-title">
      <div className={styles.header}>
        <CommonReveal tag="p" className="eyebrow">
          {t('eyebrow')}
        </CommonReveal>
        <CommonTitleReveal
          tag="h2"
          id="demo-title"
          className={styles.title}
          accentClassName={styles.accent}
          text={t.raw('title') as string}
        />
        <CommonReveal tag="p" className={styles.lead} delay={0.1}>
          {t('lead')}
        </CommonReveal>
      </div>

      <CommonReveal className={styles.playerWrap} delay={0.15}>
        <BlockDemoPlayer />
      </CommonReveal>
    </section>
  )
}
