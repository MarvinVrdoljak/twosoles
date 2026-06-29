'use client'

import React, {useEffect, useId, useRef, useState} from 'react'
import {ChevronDown} from 'lucide-react'
import styles from './CommonSelect.module.css'

export interface SelectOption {
  label: string
  value: string
}

interface CommonSelectProps {
  options: SelectOption[]
  value: string
  onChange: (value: string) => void
  placeholder?: string
  ariaLabel?: string
  className?: string
  variant?: 'basic' | 'input'
  // Optional override for the closed trigger (e.g. a compact "DE" while the
  // open list shows full names). Defaults to the selected option's label.
  triggerLabel?: string
}

// Accessible custom dropdown: keyboard navigable, closes on outside click /
// Escape, and exposes combobox/listbox semantics. Icons come from lucide.
export function CommonSelect({
  options,
  value,
  onChange,
  placeholder = 'Bitte auswählen …',
  ariaLabel,
  className = '',
  variant = 'basic',
  triggerLabel,
}: CommonSelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [focusedIndex, setFocusedIndex] = useState(-1)
  const rootRef = useRef<HTMLDivElement>(null)
  const listboxId = useId()

  const close = () => {
    setIsOpen(false)
    setFocusedIndex(-1)
  }

  const selectOption = (optionValue: string) => {
    onChange(optionValue)
    close()
  }

  // Close on click outside.
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        close()
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (!isOpen) {
      if (event.key === 'Enter' || event.key === ' ' || event.key === 'ArrowDown') {
        event.preventDefault()
        setIsOpen(true)
        setFocusedIndex(Math.max(0, options.findIndex((option) => option.value === value)))
      }
      return
    }

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault()
        setFocusedIndex((index) => (index + 1) % options.length)
        break
      case 'ArrowUp':
        event.preventDefault()
        setFocusedIndex((index) => (index - 1 + options.length) % options.length)
        break
      case 'Enter':
      case ' ':
        event.preventDefault()
        if (focusedIndex >= 0) {
          selectOption(options[focusedIndex].value)
        }
        break
      case 'Escape':
        event.preventDefault()
        close()
        break
      default:
        break
    }
  }

  const selected = options.find((option) => option.value === value)
  const activeOptionId = isOpen && focusedIndex >= 0 ? `${listboxId}-${focusedIndex}` : undefined

  return (
    <div
      ref={rootRef}
      className={`${styles.root} ${className}`}
      role="combobox"
      tabIndex={0}
      aria-haspopup="listbox"
      aria-expanded={isOpen}
      aria-controls={listboxId}
      aria-activedescendant={activeOptionId}
      aria-label={ariaLabel}
      onClick={() => setIsOpen((open) => !open)}
      onKeyDown={handleKeyDown}
    >
      <div className={`${styles.field} ${variant === 'input' ? styles.variantInput : ''}`}>
        <span className={styles.label}>{triggerLabel ?? (selected ? selected.label : placeholder)}</span>
        <ChevronDown
          size={16}
          className={`${styles.arrow} ${isOpen ? styles.arrowOpen : ''}`}
          aria-hidden="true"
        />
      </div>

      <ul
        id={listboxId}
        role="listbox"
        className={`${styles.options} ${isOpen ? styles.optionsOpen : ''}`}
      >
        {options.map((option, index) => (
          <li
            key={option.value}
            id={`${listboxId}-${index}`}
            role="option"
            aria-selected={option.value === value}
            className={`${styles.option} ${option.value === value ? styles.optionSelected : ''} ${
              index === focusedIndex ? styles.optionFocused : ''
            }`}
            onClick={(event) => {
              event.stopPropagation()
              selectOption(option.value)
            }}
          >
            {option.label}
          </li>
        ))}
      </ul>
    </div>
  )
}
