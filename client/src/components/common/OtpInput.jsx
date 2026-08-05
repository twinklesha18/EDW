import { useRef } from 'react'

const OTP_LENGTH = 6
const digitsOnly = (value) => String(value || '').replace(/\D/g, '').slice(0, OTP_LENGTH)

function OtpInput({ value = '', onChange, onBlur, error, disabled = false }) {
  const inputRefs = useRef([])
  const digits = Array.from({ length: OTP_LENGTH }, (_, index) => value[index] || '')

  const focusInput = (index) => inputRefs.current[Math.max(0, Math.min(index, OTP_LENGTH - 1))]?.focus()

  const updateDigit = (index, rawValue) => {
    const incoming = digitsOnly(rawValue)
    if (incoming.length > 1) {
      onChange(digitsOnly(`${value.slice(0, index)}${incoming}`))
      focusInput(Math.min(index + incoming.length, OTP_LENGTH - 1))
      return
    }
    const nextDigits = [...digits]
    nextDigits[index] = incoming
    onChange(nextDigits.join(''))
    if (incoming && index < OTP_LENGTH - 1) focusInput(index + 1)
  }

  const handleKeyDown = (event, index) => {
    if (event.key === 'Backspace' && !digits[index] && index > 0) {
      event.preventDefault()
      const nextDigits = [...digits]
      nextDigits[index - 1] = ''
      onChange(nextDigits.join(''))
      focusInput(index - 1)
    }
    if (event.key === 'ArrowLeft' && index > 0) {
      event.preventDefault()
      focusInput(index - 1)
    }
    if (event.key === 'ArrowRight' && index < OTP_LENGTH - 1) {
      event.preventDefault()
      focusInput(index + 1)
    }
  }

  const handlePaste = (event) => {
    const pastedOtp = digitsOnly(event.clipboardData.getData('text'))
    if (!pastedOtp) return
    event.preventDefault()
    onChange(pastedOtp)
    focusInput(Math.min(pastedOtp.length, OTP_LENGTH) - 1)
  }

  return <fieldset disabled={disabled}>
    <legend className="form-label">Verification code</legend>
    <div className="grid grid-cols-6 gap-1.5 sm:gap-2" onPaste={handlePaste}>
      {digits.map((digit, index) => <input
        key={index}
        ref={(element) => { inputRefs.current[index] = element }}
        type="text"
        inputMode="numeric"
        autoFocus={index === 0}
        autoComplete={index === 0 ? 'one-time-code' : 'off'}
        value={digit}
        maxLength={index === 0 ? OTP_LENGTH : 1}
        aria-label={`Verification code digit ${index + 1}`}
        aria-invalid={Boolean(error)}
        onChange={(event) => updateDigit(index, event.target.value)}
        onKeyDown={(event) => handleKeyDown(event, index)}
        onBlur={onBlur}
        className={`h-12 min-w-0 rounded-xl border bg-cream text-center text-xl font-semibold text-ink caret-rosewood transition-all focus:-translate-y-0.5 focus:bg-white focus:outline-none sm:h-14 sm:rounded-2xl sm:text-2xl ${error ? 'border-red-400 focus:border-red-500' : 'border-gold/30 focus:border-rosewood focus:shadow-[0_8px_24px_-14px_rgba(169,79,115,0.8)]'}`}
      />)}
    </div>
    {error && <span role="alert" className="mt-2 block text-xs text-red-600">{error}</span>}
  </fieldset>
}

export default OtpInput
