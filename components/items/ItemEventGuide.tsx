'use client'

import {useEffect, useState} from 'react'
import {createTranslator, useLocale, useTranslations} from 'next-intl'
import {ArrowUpRight, Download} from 'lucide-react'
import {CommonButton} from '@/components/common/CommonButton'
import {GameQr} from '@/components/game/GameQr'
import {Link, getPathname} from '@/i18n/navigation'
import {routing} from '@/i18n/routing'
import type {Locale} from '@/i18n/routing'
import {downloadGuidePdf} from '@/utility/pdf/guidePdf'
import styles from './../form/FormEventDetail.module.css'

type Step = {title: string; text: string}

// Lazy per-locale message loaders so the PDF can be rendered in the event's
// game language, independent of the dashboard UI locale.
const MESSAGES: Record<Locale, () => Promise<{default: Record<string, unknown>}>> = {
  de: () => import('@/i18n/messages/de.json'),
  en: () => import('@/i18n/messages/en.json'),
}

// The app augments next-intl's message types, so a translator built from
// runtime-loaded messages needs a loose signature.
type LooseTranslator = ((key: string) => string) & {
  raw: (key: string) => unknown
}

// Route segment per view, in the SAME order as the `guide.views` translation
// array (Leinwand → Gäste-Handy → Host-Steuerung).
const VIEW_PATHS = ['display', 'guest', 'host'] as const

type ItemEventGuideProps = {
  eventId: string
  couple: string
  gameLanguage: string
}

// Static "how to play" tab. The three view cards show a QR code and open the
// live game views; the download button renders the whole guide as a PDF.
export function ItemEventGuide({eventId, couple, gameLanguage}: ItemEventGuideProps) {
  const t = useTranslations('eventDetail')
  const locale = useLocale() as Locale
  const needs = t.raw('guide.needs') as string[]
  const steps = t.raw('guide.steps') as Step[]
  const views = t.raw('guide.views') as Step[]
  const tips = t.raw('guide.tips') as string[]

  // Absolute URLs are only known on the client — the QR codes must be
  // scannable, so build them from the live origin after mount.
  const [origin, setOrigin] = useState('')
  const [pdfBusy, setPdfBusy] = useState(false)
  useEffect(() => {
    setOrigin(window.location.origin)
  }, [])
  const absolute = (href: string) => (origin ? `${origin}${getPathname({href, locale})}` : '')

  const viewHref = (index: number) => `/${VIEW_PATHS[index]}/${eventId}`

  const handleDownload = async () => {
    setPdfBusy(true)
    try {
      // Render the guide in the event's game language, not the dashboard locale.
      const lang = (routing.locales as readonly string[]).includes(gameLanguage)
        ? (gameLanguage as Locale)
        : locale
      const messages = (await MESSAGES[lang]()).default
      const g = createTranslator({
        locale: lang,
        messages,
        namespace: 'eventDetail.guide',
      }) as unknown as LooseTranslator

      const guideViews = (g.raw('views') as Step[]).map((view, index) => ({
        ...view,
        url: absolute(viewHref(index)),
      }))

      await downloadGuidePdf({
        fileName: `${g('title')} – ${couple}.pdf`,
        eyebrow: couple,
        title: g('title'),
        intro: g('intro'),
        needsTitle: g('needsTitle'),
        needs: g.raw('needs') as string[],
        stepsTitle: g('stepsTitle'),
        steps: g.raw('steps') as Step[],
        viewsTitle: g('viewsTitle'),
        views: guideViews,
        tipsTitle: g('tipsTitle'),
        tips: g.raw('tips') as string[],
      })
    } finally {
      setPdfBusy(false)
    }
  }

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
                <Link href={viewHref(index)} className={styles.viewOpen}>
                  <ArrowUpRight size={16} aria-hidden="true" />
                  {t('guide.open')}
                </Link>
              </span>
              <span className={styles.viewQr}>
                <GameQr value={absolute(viewHref(index))} />
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
        <CommonButton variant="primary" size="md" onClick={handleDownload} disabled={pdfBusy}>
          <Download size={18} aria-hidden="true" />
          {pdfBusy ? t('pdf.generating') : t('guide.download')}
        </CommonButton>
      </div>
    </div>
  )
}
