import { forwardRef } from 'react'

const FormInput = forwardRef(function FormInput({ label, error, hint, className = '', ...props }, ref) {
  const errorId = error ? `${props.id || props.name}-error` : undefined
  return <label className={`block ${className}`}><span className="form-label">{label}</span><input ref={ref} className={`input-field ${error ? 'border-red-400' : ''}`} aria-invalid={Boolean(error)} aria-describedby={errorId} {...props} />{error && <span id={errorId} className="mt-1.5 block text-xs text-red-600">{error}</span>}{hint && !error && <span className="mt-1.5 block text-xs text-muted">{hint}</span>}</label>
})
export default FormInput
