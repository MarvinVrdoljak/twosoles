import styles from './FormField.module.css'

type FormFieldProps = {
  id: string
  label: string
  type: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  autoComplete?: string
  required?: boolean
  disabled?: boolean
  hint?: string
  name?: string
  min?: string
  max?: string
  // Render a multi-line <textarea> instead of an <input> (same styling).
  multiline?: boolean
  rows?: number
}

// Labelled text input with consistent styling. Used inside the auth + account
// forms. Pass `multiline` to render a textarea (e.g. the contact message field).
export function FormField({
  id,
  label,
  type,
  value,
  onChange,
  placeholder,
  autoComplete,
  required,
  disabled,
  hint,
  name,
  min,
  max,
  multiline,
  rows = 5,
}: FormFieldProps) {
  return (
    <div className={styles.root}>
      <label htmlFor={id} className={styles.label}>
        {label}
      </label>
      {multiline ? (
        <textarea
          id={id}
          name={name ?? id}
          value={value}
          placeholder={placeholder}
          autoComplete={autoComplete}
          required={required}
          disabled={disabled}
          rows={rows}
          className={`${styles.input} ${styles.textarea}`}
          onChange={(event) => onChange(event.target.value)}
        />
      ) : (
        <div className={styles.control}>
          <input
            id={id}
            name={name ?? id}
            type={type}
            value={value}
            placeholder={placeholder}
            autoComplete={autoComplete}
            required={required}
            disabled={disabled}
            min={min}
            max={max}
            // <input type="date"> ignores `placeholder`, so mobile shows the raw
            // format hint (tt.mm.jjjj). Flag the empty state so CSS can hide that
            // native text and let the overlay below stand in as the placeholder.
            data-empty={type === 'date' && value === '' ? 'true' : undefined}
            className={styles.input}
            onChange={(event) => onChange(event.target.value)}
          />
          {type === 'date' && placeholder && value === '' ? (
            <span className={styles.datePlaceholder} aria-hidden="true">
              {placeholder}
            </span>
          ) : null}
        </div>
      )}
      {hint ? <p className={styles.hint}>{hint}</p> : null}
    </div>
  )
}
