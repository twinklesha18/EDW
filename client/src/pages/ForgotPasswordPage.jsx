import { yupResolver } from '@hookform/resolvers/yup'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { FiArrowLeft, FiMail } from 'react-icons/fi'
import { Link, useNavigate } from 'react-router-dom'
import FormInput from '../components/common/FormInput.jsx'
import LoadingButton from '../components/common/LoadingButton.jsx'
import api, { getApiError } from '../services/api.js'
import { forgotPasswordSchema, passwordResetOtpSchema } from '../utils/validationSchemas.js'

function ForgotPasswordPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState('email')
  const [email, setEmail] = useState('')
  const [state, setState] = useState({ loading: false, message: '', error: '', developmentOtp: '' })
  const [cooldown, setCooldown] = useState(0)
  const emailForm = useForm({ resolver: yupResolver(forgotPasswordSchema) })
  const otpForm = useForm({ resolver: yupResolver(passwordResetOtpSchema) })

  useEffect(() => {
    if (cooldown <= 0) return undefined
    const timer = window.setInterval(() => setCooldown((value) => Math.max(0, value - 1)), 1000)
    return () => window.clearInterval(timer)
  }, [cooldown])

  const requestOtp = async ({ email: requestedEmail }) => {
    setState({ loading: true, message: '', error: '', developmentOtp: '' })
    try {
      const response = (await api.post('/auth/forgot-password', { email: requestedEmail }, { timeout: 30000 })).data
      const developmentOtp = response.data?.developmentOtp || ''
      setEmail(requestedEmail)
      setStep('otp')
      setCooldown(60)
      setState({ loading: false, message: response.message, error: '', developmentOtp })
      if (developmentOtp) otpForm.setValue('otp', developmentOtp)
    } catch (error) {
      setState({ loading: false, message: '', error: getApiError(error).message, developmentOtp: '' })
    }
  }

  const verifyOtp = async ({ otp }) => {
    setState((current) => ({ ...current, loading: true, error: '' }))
    try {
      const response = (await api.post('/auth/verify-reset-otp', { email, otp })).data
      navigate(`/reset-password/${response.data.resetToken}`, {
        replace: true,
        state: { verifiedEmail: email, expiresInMinutes: response.data.expiresInMinutes },
      })
    } catch (error) {
      setState((current) => ({ ...current, loading: false, error: getApiError(error).message }))
    }
  }

  const changeEmail = () => {
    setStep('email')
    setEmail('')
    setCooldown(0)
    otpForm.reset()
    setState({ loading: false, message: '', error: '', developmentOtp: '' })
  }

  return <>
    <p className="text-xs font-semibold uppercase tracking-[.2em] text-gold">Account recovery</p>
    <h1 className="mt-2 font-serif text-4xl font-semibold">{step === 'email' ? 'Forgot your password?' : 'Check your email'}</h1>
    <p className="mt-2 text-sm leading-6 text-muted">{step === 'email' ? 'Enter the email address registered with your account.' : <>Enter the 6-digit verification code sent to <strong className="text-ink">{email}</strong>.</>}</p>

    {state.message && <div className="mt-5 flex gap-3 rounded-xl bg-green-50 p-4 text-sm text-green-800"><FiMail className="mt-0.5 shrink-0" /><p>{state.message}</p></div>}
    {state.developmentOtp && <p className="mt-3 rounded-xl bg-amber-50 p-3 text-xs text-amber-800">Local development code: <strong>{state.developmentOtp}</strong></p>}
    {state.error && <p role="alert" className="mt-5 rounded-xl bg-red-50 p-3 text-sm text-red-700">{state.error}</p>}

    {step === 'email' ? <form className="mt-7 space-y-5" onSubmit={emailForm.handleSubmit(requestOtp)}>
      <FormInput label="Registered email address" type="email" placeholder="you@example.com" autoComplete="email" error={emailForm.formState.errors.email?.message} {...emailForm.register('email')} />
      <LoadingButton type="submit" loading={state.loading}>Send Verification Code</LoadingButton>
    </form> : <form className="mt-7 space-y-5" onSubmit={otpForm.handleSubmit(verifyOtp)}>
      <FormInput label="Verification code" type="text" inputMode="numeric" pattern="[0-9]*" maxLength={6} placeholder="Enter 6-digit code" autoComplete="one-time-code" error={otpForm.formState.errors.otp?.message} {...otpForm.register('otp')} />
      <LoadingButton type="submit" loading={state.loading}>Verify Code</LoadingButton>
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
        <button type="button" className="inline-flex items-center gap-1 font-semibold text-rosewood" onClick={changeEmail}><FiArrowLeft /> Change email</button>
        <button type="button" disabled={state.loading || cooldown > 0} className="font-semibold text-rosewood disabled:cursor-not-allowed disabled:text-muted" onClick={() => requestOtp({ email })}>{cooldown > 0 ? `Resend code in ${cooldown}s` : 'Resend code'}</button>
      </div>
    </form>}

    <p className="mt-6 text-center text-sm"><Link className="font-semibold text-rosewood" to="/login">Back to login</Link></p>
  </>
}

export default ForgotPasswordPage
