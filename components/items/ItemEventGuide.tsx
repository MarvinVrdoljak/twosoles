'use client'

import {useTranslations} from 'next-intl'
import {ArrowUpRight, Download} from 'lucide-react'
import {CommonButton} from '@/components/common/CommonButton'
import styles from './../form/FormEventDetail.module.css'

type Step = {title: string; text: string}

// Static "how to play" tab. Openable views + PDF are placeholders for now.
export function ItemEventGuide({onStub}: {onStub: () => void}) {
  const t = useTranslations('eventDetail')
  const needs = t.raw('guide.needs') as string[]
  const steps = t.raw('guide.steps') as Step[]
  const views = t.raw('guide.views') as Step[]
  const tips = t.raw('guide.tips') as string[]

  return (
    <div className={styles.guide}>
      <section className={styles.guideSection}>
        <h2 className={styles.guideTitle}>{t('guide.title')}</h2>
        <p className={styles.guideIntro}>{t('guide.intro')}</p>
      </section>

      <hr className={styles.divider} />

      <section className={styles.guideSection}>
        <h3 className={styles.guideHeading}>{t('guide.needsTitle')}</h3>
        <ul className={styles.bullets}>
          {needs.map((need) => (
            <li key={need}>{need}</li>
          ))}
        </ul>
      </section>

      <section className={styles.guideSection}>
        <h3 className={styles.guideHeading}>{t('guide.stepsTitle')}</h3>
        <ol className={styles.steps}>
          {steps.map((step, index) => (
            <li key={step.title} className={styles.step}>
              <span className={styles.stepNumber}>{index + 1}</span>
              <span className={styles.stepBody}>
                <span className={styles.stepTitle}>{step.title}</span>
                <span className={styles.stepText}>{step.text}</span>
              </span>
            </li>
          ))}
        </ol>
      </section>

      <section className={styles.guideSection}>
        <h3 className={styles.guideHeading}>{t('guide.viewsTitle')}</h3>
        <div className={styles.views}>
          {views.map((view, index) => (
            <div key={view.title} className={styles.view}>
              <span className={styles.stepNumber}>{index + 1}</span>
              <span className={styles.viewBody}>
                <span className={styles.viewTextGroup}>
                  <span className={styles.viewTitle}>{view.title}</span>
                  <span className={styles.viewText}>{view.text}</span>
                </span>
                <button type="button" className={styles.viewOpen} onClick={onStub}>
                  <ArrowUpRight size={16} aria-hidden="true" />
                  {t('guide.open')}
                </button>
              </span>
            </div>
          ))}
        </div>
      </section>

      <section className={styles.guideSection}>
        <h3 className={styles.guideHeading}>{t('guide.tipsTitle')}</h3>
        <ul className={styles.bullets}>
          {tips.map((tip) => (
            <li key={tip}>{tip}</li>
          ))}
        </ul>
      </section>

      <hr className={styles.divider} />

      <div className={styles.guideDownload}>
        <p className={styles.guideDownloadHint}>{t('guide.downloadHint')}</p>
        <CommonButton variant="primary" size="md" onClick={onStub}>
          <Download size={18} aria-hidden="true" />
          {t('guide.download')}
        </CommonButton>
      </div>
    </div>
  )
}
