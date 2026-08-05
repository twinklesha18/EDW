import { yupResolver } from '@hookform/resolvers/yup'
import { useEffect, useRef, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { FiArrowLeft, FiCheckCircle, FiKey, FiMail, FiShield } from 'react-icons/fi'
import { Link, useNavigate } from 'react-router-dom'
import FormInput from '../components/common/FormInput.jsx'
import LoadingButton from '../components/common/LoadingButton.jsx'
import OtpInput from '../components/common/OtpInput.jsx'
import RecoveryProgress from '../components/common/RecoveryProgress.jsx'
import api, { getApiError } from '../services/api.js'
import { forgotPasswordSchema, passwordResetOtpSchema } from '../utils/validationSchemas.js'

const maskEmail = (email) => {
  const [localPart = '', domain = ''] = String(email).split('@')
  const visible = localPart.slice(0, Math.min(2, localPart.length))
  return `${visible}${'•'.repeat(Math.max(3, localPart.length - visible.length))}@${domain}`
}

const formatTimer = (seconds) => `0:${String(seconds).padStart(2, '0')}`

function ForgotPasswordPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState('email')
  const [email, setEmail] = useState('')
  const [state, setState] = useState({ loading: false, error: '', expiresInMinutes: 10 })
  const [cooldown, setCooldown] = useState(0)
  const actionInFlight = useRef(false)
  const emailForm = useForm({ resolver: yupResolver(forgotPasswordSchema) })
  const otpForm = useForm({ resolver: yupResolver(passwordResetOtpSchema), defaultValues: { otp: '' } })

  useEffect(() => {
    if (cooldown <= 0) return undefined
    const timer = window.setTimeout(() => setCooldown((value) => Math.max(0, value - 1)), 1000)
    return () => window.clearTimeout(timer)
  }, [cooldown])

  const requestOtp = async ({ email: requestedEmail }) => {
    if (actionInFlight.current) return
    actionInFlight.current = true
    emailForm.clearErrors('email')
    setState((current) => ({ ...current, loading: true, error: '' }))
    try {
      const response = (await api.post('/auth/forgot-password', { email: requestedEmail }, { timeout: 30000 })).data
      setEmail(requestedEmail)
      setStep('otp')
      setCooldown(60)
      otpForm.reset({ otp: '' })
      setState({ loading: false, error: '', expiresInMinutes: response.data?.expiresInMinutes || 10 })
    } catch (error) {
      const apiError = getApiError(error)
      const emailError = apiError.errors.find((entry) => entry.field === 'email')?.message
      if (emailError) emailForm.setError('email', { type: 'server', message: emailError })
      setState((current) => ({ ...current, loading: false, error: emailError ? '' : apiError.message }))
    } finally {
      actionInFlight.current = false
    }
  }

  const verifyOtp = async ({ otp }) => {
    if (actionInFlight.current) return
    actionInFlight.current = true
    setState((current) => ({ ...current, loading: true, error: '' }))
    otpForm.clearErrors('otp')
    try {
      const response = (await api.post('/auth/verify-reset-otp', { email, otp })).data
      navigate(`/reset-password/${response.data.resetToken}`, {
        replace: true,
        state: { verifiedEmail: email, expiresInMinutes: response.data.expiresInMinutes },
      })
    } catch (error) {
      const apiError = getApiError(error)
      otpForm.setError('otp', { type: 'server', message: apiError.message })
      setState((current) => ({ ...current, loading: false }))
    } finally {
      actionInFlight.current = false
    }
  }

  const changeEmail = () => {
    setStep('email')
    setEmail('')
    setCooldown(0)
    actionInFlight.current = false
    otpForm.reset({ otp: '' })
    setState({ loading: false, error: '', expiresInMinutes: 10 })
  }

  return <>
    <RecoveryProgress currentStep={step === 'email' ? 1 : 2} />

    <div className="text-center">
      <span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl border border-rosewood/15 bg-gradient-to-br from-pink-light to-white text-2xl text-rosewood shadow-[0_14px_35px_-24px_rgba(169,79,115,0.7)]" aria-hidden="true">{step === 'email' ? <FiKey /> : <FiMail />}</span>
      <p className="mt-5 text-[.68rem] font-semibold uppercase tracking-[.24em] text-gold">Secure account recovery</p>
      <h1 className="mt-2 font-serif text-3xl font-semibold sm:text-4xl">{step === 'email' ? 'Reset your password' : 'Verify your email'}</h1>
      <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-muted">{step === 'email' ? 'Enter your registered email address and we’ll send you a secure verification code.' : <>We sent a 6-digit code to <strong className="font-semibold text-ink">{maskEmail(email)}</strong></>}</p>
    </div>

    {state.error && <div role="alert" className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{state.error}</div>}

    {step === 'email' ? <form className="mt-7 space-y-5" onSubmit={emailForm.handleSubmit(requestOtp)}>
      <FormInput label="Email address" type="email" placeholder="Enter your registered email" autoComplete="email" error={emailForm.formState.errors.email?.message} {...emailForm.register('email')} />
      <LoadingButton type="submit" loading={state.loading}><FiMail aria-hidden="true" /> Send Verification Code</LoadingButton>
      <div className="flex items-start gap-2 rounded-2xl bg-blue-light/35 px-4 py-3 text-xs leading-5 text-muted"><FiShield className="mt-0.5 shrink-0 text-rosewood" aria-hidden="true" /><p>For your security, we only send codes to email addresses already registered with an active account.</p></div>
    </form> : <form className="mt-7 space-y-5" onSubmit={otpForm.handleSubmit(verifyOtp)}>
      <div aria-live="polite" className="flex items-center justify-center gap-2 text-xs font-medium text-green-700"><FiCheckCircle aria-hidden="true" /> Verification code sent securely</div>
      <Controller
        name="otp"
        control={otpForm.control}
        render={({ field, fieldState }) => <OtpInput {...field} disabled={state.loading} error={fieldState.error?.message} />}
      />
      <p className="text-center text-xs leading-5 text-muted">The code expires in {state.expiresInMinutes} minutes and can be used only once.</p>
      <LoadingButton type="submit" loading={state.loading}><FiShield aria-hidden="true" /> Verify &amp; Continue</LoadingButton>

      <div className="rounded-2xl border border-gold/15 bg-cream/70 px-4 py-3 text-center text-xs">
        {cooldown > 0 ? <p className="text-muted">You can request a new code in <span className="font-semibold tabular-nums text-ink">{formatTimer(cooldown)}</span></p> : <button type="button" disabled={state.loading} className="font-semibold text-rosewood hover:underline disabled:opacity-50" onClick={() => requestOtp({ email })}>Didn’t receive it? Resend code</button>}
      </div>

      <button type="button" className="mx-auto flex min-h-11 items-center justify-center gap-2 text-xs font-semibold text-muted transition-colors hover:text-rosewood" onClick={changeEmail}><FiArrowLeft aria-hidden="true" /> Use a different email</button>
    </form>}

    <div className="mt-6 border-t border-gold/15 pt-5 text-center">
      <Link className="inline-flex min-h-11 items-center justify-center gap-2 text-sm font-semibold text-rosewood hover:underline" to="/login"><FiArrowLeft aria-hidden="true" /> Back to login</Link>
    </div>
  </>
}

export default ForgotPasswordPage
