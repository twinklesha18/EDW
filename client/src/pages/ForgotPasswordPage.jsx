import { yupResolver } from '@hookform/resolvers/yup'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { FiExternalLink } from 'react-icons/fi'
import { Link } from 'react-router-dom'
import FormInput from '../components/common/FormInput.jsx'
import LoadingButton from '../components/common/LoadingButton.jsx'
import api, { getApiError } from '../services/api.js'
import { forgotPasswordSchema } from '../utils/validationSchemas.js'
function ForgotPasswordPage() {
  const [state, setState] = useState({ loading: false, message: '', resetUrl: '', error: '' }); const { register, handleSubmit, formState: { errors } } = useForm({ resolver: yupResolver(forgotPasswordSchema) })
  const submit = async (values) => { setState({ loading: true, message: '', resetUrl: '', error: '' }); try { const response = (await api.post('/auth/forgot-password', values)).data; setState({ loading: false, message: response.message, resetUrl: response.data?.resetUrl || '', error: '' }) } catch (error) { setState({ loading: false, message: '', resetUrl: '', error: getApiError(error).message }) } }
  return <><p className="text-xs font-semibold uppercase tracking-[.2em] text-gold">Account recovery</p><h1 className="mt-2 font-serif text-4xl font-semibold">Forgot your password?</h1><p className="mt-2 text-sm leading-6 text-muted">Enter your email and we’ll prepare secure reset instructions.</p>{state.message && <div className="mt-5 rounded-xl bg-green-50 p-4 text-sm text-green-800"><p>{state.message}</p>{state.resetUrl && <a href={state.resetUrl} className="mt-3 inline-flex items-center gap-2 font-semibold underline" rel="noreferrer"><FiExternalLink /> Development testing link</a>}</div>}{state.error && <p className="mt-5 rounded-xl bg-red-50 p-3 text-sm text-red-700">{state.error}</p>}<form className="mt-7 space-y-5" onSubmit={handleSubmit(submit)}><FormInput label="Email address" type="email" autoComplete="email" error={errors.email?.message} {...register('email')} /><LoadingButton type="submit" loading={state.loading}>Request Reset Link</LoadingButton></form><p className="mt-6 text-center text-sm"><Link className="font-semibold text-rosewood" to="/login">Back to login</Link></p></>
}
export default ForgotPasswordPage
