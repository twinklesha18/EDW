import { yupResolver } from '@hookform/resolvers/yup'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate, useParams } from 'react-router-dom'
import LoadingButton from '../components/common/LoadingButton.jsx'
import PasswordInput from '../components/common/PasswordInput.jsx'
import { resetUserPassword } from '../redux/slices/authSlice.js'
import { resetPasswordSchema } from '../utils/validationSchemas.js'
function ResetPasswordPage() { const { token } = useParams(); const dispatch = useDispatch(), navigate = useNavigate(); const { isLoading, error } = useSelector((state) => state.auth); const { register, handleSubmit, formState: { errors } } = useForm({ resolver: yupResolver(resetPasswordSchema) }); const submit = async (values) => { try { await dispatch(resetUserPassword({ token, values })).unwrap(); toast.success('Password reset successfully.'); navigate('/profile', { replace: true }) } catch { /* Displayed below. */ } }; return <><p className="text-xs font-semibold uppercase tracking-[.2em] text-gold">Secure reset</p><h1 className="mt-2 font-serif text-4xl font-semibold">Choose a new password</h1><p className="mt-2 text-sm text-muted">Create a strong password you have not used for this account.</p>{error && <p className="mt-5 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error.message}</p>}<form onSubmit={handleSubmit(submit)} className="mt-7 space-y-5"><PasswordInput label="New password" autoComplete="new-password" error={errors.password?.message} {...register('password')} /><PasswordInput label="Confirm new password" autoComplete="new-password" error={errors.confirmPassword?.message} {...register('confirmPassword')} /><LoadingButton type="submit" loading={isLoading}>Reset Password</LoadingButton></form></> }
export default ResetPasswordPage
