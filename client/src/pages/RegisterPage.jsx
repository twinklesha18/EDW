import { yupResolver } from '@hookform/resolvers/yup'
import { useEffect } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import toast from 'react-hot-toast'
import { useDispatch, useSelector } from 'react-redux'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import FormInput from '../components/common/FormInput.jsx'
import LoadingButton from '../components/common/LoadingButton.jsx'
import PasswordInput from '../components/common/PasswordInput.jsx'
import { clearAuthError, registerUser } from '../redux/slices/authSlice.js'
import { registerSchema } from '../utils/validationSchemas.js'
function RegisterPage() {
  const dispatch = useDispatch(), navigate = useNavigate(), location = useLocation(); const { isLoading, error } = useSelector((state) => state.auth)
  const { register, control, handleSubmit, formState: { errors } } = useForm({ resolver: yupResolver(registerSchema), defaultValues: { firstName: '', lastName: '', email: '', phone: '', password: '', confirmPassword: '', terms: false } })
  const password = useWatch({ control, name: 'password' }) || ''; const strength = [password.length >= 8, /[a-z]/.test(password), /[A-Z]/.test(password), /\d/.test(password)].filter(Boolean).length
  useEffect(() => () => dispatch(clearAuthError()), [dispatch])
  const submit = async ({ terms: _terms, ...values }) => { try { await dispatch(registerUser(values)).unwrap(); toast.success('Welcome to Eshaz Dream World!'); navigate(location.state?.from || '/profile', { replace: true }) } catch { /* Rendered below. */ } }
  return <><p className="text-xs font-semibold uppercase tracking-[.2em] text-gold">Join Eshaz Dream World</p><h1 className="mt-2 font-serif text-4xl font-semibold">Create your account</h1><p className="mt-2 text-sm text-muted">Save favourites and make every thoughtful detail easier.</p>{error && <p role="alert" className="mt-5 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error.message}</p>}<form onSubmit={handleSubmit(submit)} className="mt-7 space-y-5" noValidate><div className="grid gap-4 sm:grid-cols-2"><FormInput label="First name" autoComplete="given-name" error={errors.firstName?.message} {...register('firstName')} /><FormInput label="Last name" autoComplete="family-name" error={errors.lastName?.message} {...register('lastName')} /></div><FormInput label="Email address" type="email" autoComplete="email" error={errors.email?.message} {...register('email')} /><FormInput label="Phone number" type="tel" inputMode="numeric" maxLength={10} autoComplete="tel" placeholder="0750894221" error={errors.phone?.message} {...register('phone')} /><PasswordInput label="Password" autoComplete="new-password" error={errors.password?.message} {...register('password')} /><div><div className="grid grid-cols-4 gap-1" aria-label={`Password strength ${strength} of 4`}>{[1,2,3,4].map((step) => <span key={step} className={`h-1.5 rounded-full ${strength >= step ? 'bg-rosewood' : 'bg-pink-light'}`} />)}</div><p className="mt-2 text-[.7rem] text-muted">Use 8+ characters with uppercase, lowercase and a number.</p></div><PasswordInput label="Confirm password" autoComplete="new-password" error={errors.confirmPassword?.message} {...register('confirmPassword')} /><label className="flex items-start gap-3 text-xs leading-5 text-muted"><input type="checkbox" className="mt-1 accent-rosewood" {...register('terms')} /><span>I agree to the <Link to="/terms" className="font-semibold text-rosewood">Terms and Conditions</Link>.</span></label>{errors.terms && <p className="text-xs text-red-600">{errors.terms.message}</p>}<LoadingButton loading={isLoading} type="submit">Create Account</LoadingButton></form><p className="mt-6 text-center text-sm text-muted">Already have an account? <Link to="/login" className="font-semibold text-rosewood">Login</Link></p></>
}
export default RegisterPage
