import { yupResolver } from '@hookform/resolvers/yup'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { useDispatch, useSelector } from 'react-redux'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import FormInput from '../components/common/FormInput.jsx'
import LoadingButton from '../components/common/LoadingButton.jsx'
import PasswordInput from '../components/common/PasswordInput.jsx'
import { clearAuthError, loginUser } from '../redux/slices/authSlice.js'
import { loginSchema } from '../utils/validationSchemas.js'
function LoginPage() {
  const dispatch = useDispatch(), navigate = useNavigate(), location = useLocation(); const { isLoading, error } = useSelector((state) => state.auth)
  const { register, handleSubmit, formState: { errors } } = useForm({ resolver: yupResolver(loginSchema), defaultValues: { email: '', password: '', rememberMe: false } })
  useEffect(() => () => dispatch(clearAuthError()), [dispatch])
  const submit = async (values) => { try { const user = await dispatch(loginUser(values)).unwrap(); toast.success('Login successful.'); const requestedRoute = location.state?.from; const customerRoute = requestedRoute?.startsWith('/admin') ? '/profile' : requestedRoute || '/profile'; navigate(user.role === 'admin' ? '/admin/dashboard' : customerRoute, { replace: true }) } catch { /* Rendered below. */ } }
  return <><p className="text-xs font-semibold uppercase tracking-[.2em] text-gold">Welcome back</p><h1 className="mt-2 font-serif text-4xl font-semibold">Sign in to your world</h1><p className="mt-2 text-sm text-muted">Manage your saved gifts, cart and delivery details.</p>{error && <p role="alert" className="mt-5 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error.message}</p>}<form onSubmit={handleSubmit(submit)} className="mt-7 space-y-5"><FormInput label="Email address" type="email" autoComplete="email" error={errors.email?.message} {...register('email')} /><PasswordInput label="Password" autoComplete="current-password" error={errors.password?.message} {...register('password')} /><div className="flex items-center justify-between gap-3"><label className="flex items-center gap-2 text-xs text-muted"><input type="checkbox" className="accent-rosewood" {...register('rememberMe')} /> Remember me</label><Link to="/forgot-password" className="text-xs font-semibold text-rosewood">Forgot password?</Link></div><LoadingButton loading={isLoading} type="submit">Login</LoadingButton></form><p className="mt-6 text-center text-sm text-muted">New here? <Link to="/register" className="font-semibold text-rosewood">Create an account</Link></p></>
}
export default LoginPage
