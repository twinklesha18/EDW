import { forwardRef, useState } from 'react'
import { FiEye, FiEyeOff } from 'react-icons/fi'

const PasswordInput = forwardRef(function PasswordInput({ label, error, hint, ...props }, ref) {
  const [visible, setVisible] = useState(false)
  const errorId = error ? `${props.id || props.name}-error` : undefined
  return <label className="block"><span className="form-label">{label}</span><span className="relative block"><input ref={ref} type={visible ? 'text' : 'password'} className={`input-field pr-12 ${error ? 'border-red-400' : ''}`} aria-invalid={Boolean(error)} aria-describedby={errorId} {...props} /><button type="button" onClick={() => setVisible((value) => !value)} className="absolute inset-y-0 right-1 grid w-11 place-items-center text-muted hover:text-rosewood" aria-label={visible ? 'Hide password' : 'Show password'}>{visible ? <FiEyeOff /> : <FiEye />}</button></span>{error && <span id={errorId} className="mt-1.5 block text-xs text-red-600">{error}</span>}{hint && !error && <span className="mt-1.5 block text-xs text-muted">{hint}</span>}</label>
})
export default PasswordInput
