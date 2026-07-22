function FormField({ label, name, register, rules, error, type = 'text', placeholder, options, rows = 5, min, max, maxLength, inputMode, autoComplete }) {
  const fieldId = `field-${name}`
  const shared = { id: fieldId, className: 'input-field', 'aria-invalid': Boolean(error), 'aria-describedby': error ? `${fieldId}-error` : undefined, ...register(name, rules) }

  return (
    <div>
      <label htmlFor={fieldId} className="form-label">{label}{rules?.required && <span className="text-rosewood" aria-hidden="true"> *</span>}</label>
      {type === 'textarea' ? (
        <textarea {...shared} rows={rows} placeholder={placeholder} className="input-field resize-y" />
      ) : options ? (
        <select {...shared}><option value="">Select {label.toLowerCase()}</option>{options.map((option) => <option key={option.value || option} value={option.value || option}>{option.label || option}</option>)}</select>
      ) : (
        <input {...shared} type={type} placeholder={placeholder} min={min} max={max} maxLength={maxLength} inputMode={inputMode} autoComplete={autoComplete} />
      )}
      {error && <p id={`${fieldId}-error`} className="mt-1.5 text-xs text-red-600">{error.message}</p>}
    </div>
  )
}

export default FormField
