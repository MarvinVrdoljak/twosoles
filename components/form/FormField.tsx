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
          className={styles.input}
          onChange={(event) => onChange(event.target.value)}
        />
      )}
      {hint ? <p className={styles.hint}>{hint}</p> : null}
    </div>
  )
}
