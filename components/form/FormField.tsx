import styles from './FormField.module.css'

type FormFieldProps = {
  id: string
  label: string
  type: string
  value: string
  onChange: (value: string) => void
  autoComplete?: string
  required?: boolean
  name?: string
}

// Labelled text input with consistent styling. Used inside the auth forms.
export function FormField({
  id,
  label,
  type,
  value,
  onChange,
  autoComplete,
  required,
  name,
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
        autoComplete={autoComplete}
        required={required}
        className={styles.input}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  )
}
