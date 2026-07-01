'use client'

import React, {useState} from 'react'
import {useTranslations} from 'next-intl'
import {Check, GripVertical, Plus, Shuffle, Sparkles, X} from 'lucide-react'
import {CommonButton} from '@/components/common/CommonButton'
import {CommonModal} from '@/components/common/CommonModal'
import {getCatalog} from './questionCatalog'
import type {EventDraft, EventQuestion} from './eventDraft'
import styles from './FormEventSteps.module.css'

type Props = {
  draft: EventDraft
  update: (patch: Partial<EventDraft>) => void
  title?: string
  subtitle?: string
  footer?: React.ReactNode
}

const RANDOM_COUNT = 15

function makeId() {
  return `q-${crypto.randomUUID()}`
}

export function FormEventQuestions({draft, update, title, subtitle, footer}: Props) {
  const t = useTranslations('eventWizard')
  const [input, setInput] = useState('')
  const [catalogOpen, setCatalogOpen] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [dragIndex, setDragIndex] = useState<number | null>(null)

  const questions = draft.questions
  // Catalogue follows the GAME language (draft.language), not the UI locale.
  const catalog = getCatalog(draft.language)
  const available = catalog.filter((text) => !questions.some((q) => q.text === text))

  const setQuestions = (next: EventQuestion[]) => update({questions: next})

  const addCustom = () => {
    const text = input.trim()
    if (!text) return
    setQuestions([...questions, {id: makeId(), text, custom: true}])
    setInput('')
  }

  const remove = (id: string) => {
    setQuestions(questions.filter((q) => q.id !== id))
  }

  // Draw RANDOM_COUNT distinct questions from the catalogue, replacing the list.
  const rollRandom = () => {
    const pool = [...catalog]
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[pool[i], pool[j]] = [pool[j], pool[i]]
    }
    setQuestions(pool.slice(0, RANDOM_COUNT).map((text) => ({id: makeId(), text, custom: false})))
  }

  const handleRandom = () => {
    if (questions.length === 0) {
      rollRandom()
    } else {
      setConfirmOpen(true)
    }
  }

  const moveTo = (from: number, to: number) => {
    if (from === to) return
    const next = [...questions]
    const [moved] = next.splice(from, 1)
    next.splice(to, 0, moved)
    setQuestions(next)
  }

  const openCatalog = () => {
    setSelected(new Set())
    setCatalogOpen(true)
  }

  const closeCatalog = () => {
    setCatalogOpen(false)
    setSelected(new Set())
  }

  const toggleSelect = (text: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(text)) next.delete(text)
      else next.add(text)
      return next
    })
  }

  // Commit the staged selection to the list, then close.
  const applySelected = () => {
    const additions = [...selected].map((text) => ({id: makeId(), text, custom: false}))
    if (additions.length > 0) setQuestions([...questions, ...additions])
    closeCatalog()
  }

  return (
    <div className={styles.stepCard}>
      {title ? (
        <div className={styles.cardHeader}>
          <h2 className={styles.cardTitle}>{title}</h2>
          {subtitle ? <p className={styles.cardSubtitle}>{subtitle}</p> : null}
        </div>
      ) : null}

      <div className={styles.qAddRow}>
        <input
          className={styles.qInput}
          type="text"
          value={input}
          placeholder={t('questions.addPlaceholder')}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault()
              addCustom()
            }
          }}
        />
        <CommonButton variant="primary" size="md" onClick={addCustom} disabled={!input.trim()}>
          <Plus size={18} aria-hidden="true" />
          {t('questions.add')}
        </CommonButton>
      </div>

      <div className={styles.qMeta}>
        <span className={styles.qCount}>{t('questions.count', {count: questions.length})}</span>
        <div className={styles.qMetaActions}>
          <CommonButton variant="secondary" size="sm" onClick={handleRandom}>
            <Shuffle size={16} aria-hidden="true" />
            {t('questions.random')}
          </CommonButton>
          <CommonButton variant="secondary" size="sm" onClick={openCatalog}>
            {t('questions.catalog')}
          </CommonButton>
        </div>
      </div>

      {questions.length === 0 ? (
        <p className={styles.qEmpty}>{t('questions.empty')}</p>
      ) : (
        <ul className={styles.qList}>
          {questions.map((question, index) => (
            <li
              key={question.id}
              className={`${styles.qRow} ${dragIndex === index ? styles.qRowDragging : ''}`}
              draggable
              onDragStart={() => setDragIndex(index)}
              onDragOver={(event) => {
                event.preventDefault()
                if (dragIndex === null || dragIndex === index) return
                moveTo(dragIndex, index)
                setDragIndex(index)
              }}
              onDragEnd={() => setDragIndex(null)}
            >
              <span className={styles.qHandle} aria-hidden="true">
                <GripVertical size={18} />
              </span>
              <span className={styles.qNumber}>{index + 1}</span>
              <span className={styles.qText}>{question.text}</span>
              {question.custom ? (
                <span className={styles.qCustom} title={t('questions.customBadge')}>
                  <Sparkles size={16} aria-hidden="true" />
                </span>
              ) : null}
              <button
                type="button"
                className={styles.qRemove}
                onClick={() => remove(question.id)}
                aria-label={t('questions.remove')}
              >
                <X size={18} aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {footer}

      <CommonModal
        open={catalogOpen}
        onClose={closeCatalog}
        title={t('questions.catalogTitle')}
        closeLabel={t('questions.close')}
        footer={
          <CommonButton
            variant="primary"
            size="md"
            onClick={applySelected}
            disabled={selected.size === 0}
          >
            {t('questions.apply')}
            {selected.size > 0 ? ` (${selected.size})` : ''}
          </CommonButton>
        }
      >
        {available.length === 0 ? (
          <p className={styles.catalogEmpty}>{t('questions.catalogEmpty')}</p>
        ) : (
          <ul className={styles.catalogList}>
            {available.map((text) => {
              const isSelected = selected.has(text)
              return (
                <li key={text}>
                  <button
                    type="button"
                    className={`${styles.catalogItem} ${isSelected ? styles.catalogItemSelected : ''}`}
                    onClick={() => toggleSelect(text)}
                    aria-pressed={isSelected}
                  >
                    {isSelected ? (
                      <Check size={16} aria-hidden="true" />
                    ) : (
                      <Plus size={16} aria-hidden="true" />
                    )}
                    <span>{text}</span>
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </CommonModal>

      <CommonModal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title={t('questions.randomConfirmTitle')}
        closeLabel={t('questions.close')}
      >
        <div className={styles.confirm}>
          <p className={styles.confirmText}>{t('questions.randomConfirmText')}</p>
          <div className={styles.confirmActions}>
            <CommonButton variant="secondary" size="md" onClick={() => setConfirmOpen(false)}>
              {t('questions.randomKeep')}
            </CommonButton>
            <CommonButton
              variant="primary"
              size="md"
              onClick={() => {
                rollRandom()
                setConfirmOpen(false)
              }}
            >
              {t('questions.randomConfirm')}
            </CommonButton>
          </div>
        </div>
      </CommonModal>
    </div>
  )
}
