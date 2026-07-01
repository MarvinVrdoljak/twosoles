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
}

// Labelled text input with consistent styling. Used inside the auth + account forms.
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
}: FormFieldProps) {
  return (
    <div className={styles.root}>
      <label htmlFor={id} className={styles.label}>
        {label}
      </label>
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
      {hint ? <p className={styles.hint}>{hint}</p> : null}
    </div>
  )
}
