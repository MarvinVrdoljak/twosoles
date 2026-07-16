'use client'

import React from 'react'
import {useTranslations} from 'next-intl'
import {ArrowLeft, X} from 'lucide-react'
import {CommonButton} from '@/components/common/CommonButton'
import {Link} from '@/i18n/navigation'
import styles from './LayoutEventCreation.module.css'
import Leaf03 from '@/public/images/leaf_03.svg'
import Leaf02 from '@/public/images/leaf_02.svg'

type StepMeta = {title: string; subtitle: string}

type LayoutEventCreationProps = {
  activeStep: number
  eyebrow: string
  title: string
  subtitle: string
  onBack: () => void
  onNext: () => void
  onStepClick: (step: number) => void
  nextLabel: string
  nextDisabled?: boolean
  children: React.ReactNode
}

// Full-screen shell for the event-creation wizard: a primary sidebar with the
// step progress on the left, and the current step's card + a back/next bottom
// bar on the right. Completed steps are clickable to jump back.
export function LayoutEventCreation({
  activeStep,
  eyebrow,
  title,
  subtitle,
  onBack,
  onNext,
  onStepClick,
  nextLabel,
  nextDisabled,
  children,
}: LayoutEventCreationProps) {
  const t = useTranslations('eventWizard')
  const steps = t.raw('steps') as StepMeta[]

  return (
    <div className={styles.root}>
      <aside className={styles.sidebar}>
        <div className={styles.sidebarTop}>
          <Link href="/dashboard" className={styles.logo}>
            TwoSoles
          </Link>

          <ol className={styles.steps}>
            {steps.map((step, index) => {
              const number = index + 1
              const isActive = number === activeStep
              const isDone = number < activeStep
              const canGo = number < activeStep
              return (
                <li key={number}>
                  <button
                    type="button"
                    className={styles.stepButton}
                    onClick={() => canGo && onStepClick(number)}
                    disabled={!canGo}
                    aria-current={isActive ? 'step' : undefined}
                  >
                    <span className={styles.dotCol}>
                      <span className={`${styles.line} ${styles.lineTop}`} aria-hidden="true" />
                      <span
                        className={`${styles.dot} ${isActive ? styles.dotActive : ''} ${
                          isDone ? styles.dotDone : ''
                        }`}
                      >
                        {number}
                      </span>
                      <span className={`${styles.line} ${styles.lineBottom}`} aria-hidden="true" />
                    </span>
                    <span className={styles.stepLabel}>
                      <span className={styles.stepTitle}>{step.title}</span>
                      <span className={styles.stepSubtitle}>{step.subtitle}</span>
                    </span>
                  </button>
                </li>
              )
            })}
          </ol>
        </div>

        <Link href="/dashboard" className={styles.cancel} aria-label={t('cancel')}>
          <ArrowLeft className={styles.cancelIcon} size={16} aria-hidden="true" />
          <span className={styles.cancelText}>{t('cancel')}</span>
          <X className={styles.cancelClose} size={24} aria-hidden="true" />
        </Link>
      </aside>

      <div className={styles.content}>
        <Leaf03 className={styles.leafLeft} aria-hidden="true" />
        <div className={styles.scroll}>
          <div className={styles.inner}>
            <header className={styles.head}>
              <p className={styles.eyebrow}>{eyebrow}</p>
              <h1 className={styles.title}>{title}</h1>
              <p className={styles.subtitle}>{subtitle}</p>
            </header>

            {children}
          </div>
        </div>

        <div className={styles.bottomBar}>
          {activeStep === 1 ? (
            <span />
          ) : (
            <CommonButton variant="secondary" size="md" onClick={onBack}>
              {t('back')}
            </CommonButton>
          )}
          <CommonButton variant="primary" size="md" onClick={onNext} disabled={nextDisabled}>
            {nextLabel}
          </CommonButton>
        </div>
      </div>
    </div>
  )
}
