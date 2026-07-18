'use client'

import React, {useRef, useState} from 'react'
import {useTranslations} from 'next-intl'
import {Check, GripVertical, Plus, Shuffle, X} from 'lucide-react'
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
  readOnly?: boolean
}

const RANDOM_COUNT = 15

function makeId() {
  return `q-${crypto.randomUUID()}`
}

export function FormEventQuestions({draft, update, title, subtitle, footer, readOnly}: Props) {
  const t = useTranslations('eventWizard')
  const [input, setInput] = useState('')
  const [catalogOpen, setCatalogOpen] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)

  const listRef = useRef<HTMLUListElement>(null)
  const dragIndexRef = useRef<number | null>(null)

  const questions = draft.questions
  // Catalogue follows the GAME language (draft.language), not the UI locale.
  // It never filters out already-added questions — picking one just copies it
  // into the set (duplicates allowed), and picked questions are yours to edit.
  const catalog = getCatalog(draft.language)

  const setQuestions = (next: EventQuestion[]) => update({questions: next})

  // Mirrors the live list for the pointer-drag handlers, whose window listeners
  // would otherwise close over a stale `questions` after the first reorder.
  const questionsRef = useRef(questions)
  questionsRef.current = questions

  const addCustom = () => {
    const text = input.trim()
    if (!text) return
    setQuestions([...questions, {id: makeId(), text}])
    setInput('')
  }

  const editText = (id: string, text: string) => {
    setQuestions(questions.map((q) => (q.id === id ? {...q, text} : q)))
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
    setQuestions(pool.slice(0, RANDOM_COUNT).map((text) => ({id: makeId(), text})))
  }

  const handleRandom = () => {
    if (questions.length === 0) {
      rollRandom()
    } else {
      setConfirmOpen(true)
    }
  }

  const reorder = (from: number, to: number) => {
    if (from === to || from < 0 || to < 0) return
    const next = [...questionsRef.current]
    const [moved] = next.splice(from, 1)
    next.splice(to, 0, moved)
    questionsRef.current = next
    setQuestions(next)
  }

  // Pointer-based drag so reordering works on touch (iOS) as well as mouse — the
  // HTML5 drag-and-drop API never fires from touch. The grip handle starts it;
  // while the pointer moves we swap the dragged row to whichever row it's over.
  const handlePointerMove = (event: PointerEvent) => {
    const from = dragIndexRef.current
    const list = listRef.current
    if (from === null || !list) return
    const rows = list.children
    let target = rows.length - 1
    for (let i = 0; i < rows.length; i++) {
      const rect = (rows[i] as HTMLElement).getBoundingClientRect()
      if (event.clientY < rect.top + rect.height / 2) {
        target = i
        break
      }
    }
    if (target !== from) {
      reorder(from, target)
      dragIndexRef.current = target
      setDragIndex(target)
    }
  }

  const endDrag = () => {
    dragIndexRef.current = null
    setDragIndex(null)
    window.removeEventListener('pointermove', handlePointerMove)
    window.removeEventListener('pointerup', endDrag)
    window.removeEventListener('pointercancel', endDrag)
  }

  const startDrag = (event: React.PointerEvent, index: number) => {
    if (readOnly || editingId !== null) return
    // Stop the touch from scrolling the page while dragging.
    event.preventDefault()
    dragIndexRef.current = index
    setDragIndex(index)
    window.addEventListener('pointermove', handlePointerMove)
    window.addEventListener('pointerup', endDrag)
    window.addEventListener('pointercancel', endDrag)
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
    const additions = [...selected].map((text) => ({id: makeId(), text}))
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

      {readOnly ? null : (
        <div className={styles.qAddRow}>
          <input
            className={styles.qInput}
            type="text"
            value={input}
            placeholder={t('questions.addPlaceholder')}
            aria-label={t('questions.addPlaceholder')}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault()
                addCustom()
              }
            }}
          />
          <CommonButton
            variant="primary"
            size="md"
            onClick={addCustom}
            disabled={!input.trim()}
            aria-label={t('questions.add')}
          >
            <Plus size={18} aria-hidden="true" />
            <span className={styles.addLabel}>{t('questions.add')}</span>
          </CommonButton>
        </div>
      )}

      <div className={styles.qMeta}>
        <span className={styles.qCount}>{t('questions.count', {count: questions.length})}</span>
        {readOnly ? null : (
          <div className={styles.qMetaActions}>
            <CommonButton variant="secondary" size="sm" onClick={handleRandom}>
              <Shuffle size={16} aria-hidden="true" />
              {t('questions.random')}
            </CommonButton>
            <CommonButton variant="secondary" size="sm" onClick={openCatalog}>
              {t('questions.catalog')}
            </CommonButton>
          </div>
        )}
      </div>

      {questions.length === 0 ? (
        <p className={styles.qEmpty}>{t('questions.empty')}</p>
      ) : (
        <ul className={styles.qList} ref={listRef}>
          {questions.map((question, index) => (
            <li
              key={question.id}
              className={`${styles.qRow} ${dragIndex === index ? styles.qRowDragging : ''}`}
            >
              {readOnly ? null : (
                <span
                  className={styles.qHandle}
                  onPointerDown={(event) => startDrag(event, index)}
                  aria-hidden="true"
                >
                  <GripVertical size={18} />
                </span>
              )}
              <span className={styles.qNumber}>{index + 1}</span>

              {readOnly ? (
                <span className={styles.qText}>{question.text}</span>
              ) : editingId === question.id ? (
                <input
                  className={styles.qEditInput}
                  type="text"
                  value={question.text}
                  aria-label={t('questions.editLabel')}
                  autoFocus
                  onChange={(event) => editText(question.id, event.target.value)}
                  onBlur={() => setEditingId(null)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === 'Escape') {
                      event.preventDefault()
                      setEditingId(null)
                    }
                  }}
                />
              ) : (
                <button
                  type="button"
                  className={styles.qTextButton}
                  onClick={() => setEditingId(question.id)}
                >
                  {question.text}
                </button>
              )}

              {readOnly ? null : (
                <button
                  type="button"
                  className={styles.qRemove}
                  onClick={() => remove(question.id)}
                  aria-label={t('questions.remove')}
                >
                  <X size={18} aria-hidden="true" />
                </button>
              )}
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
        <ul className={styles.catalogList}>
          {catalog.map((text) => {
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
