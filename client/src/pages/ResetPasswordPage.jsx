import { yupResolver } from '@hookform/resolvers/yup'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { FiCheck, FiLock, FiShield } from 'react-icons/fi'
import { useDispatch, useSelector } from 'react-redux'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import LoadingButton from '../components/common/LoadingButton.jsx'
import PasswordInput from '../components/common/PasswordInput.jsx'
import RecoveryProgress from '../components/common/RecoveryProgress.jsx'
import { resetUserPassword } from '../redux/slices/authSlice.js'
import { resetPasswordSchema } from '../utils/validationSchemas.js'

const requirementItems = ['8–72 characters', 'Uppercase and lowercase letters', 'At least one number']

function ResetPasswordPage() {
  const { token } = useParams()
  const location = useLocation()
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { isLoading, error } = useSelector((state) => state.auth)
  const { register, handleSubmit, formState: { errors } } = useForm({ resolver: yupResolver(resetPasswordSchema) })

  const submit = async (values) => {
    try {
      await dispatch(resetUserPassword({ token, values })).unwrap()
      toast.success('Password reset successfully.')
      navigate('/profile', { replace: true })
    } catch {
      // The API error is displayed below.
    }
  }

  return <>
    <RecoveryProgress currentStep={3} />

    <div className="text-center">
      <span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl border border-rosewood/15 bg-gradient-to-br from-pink-light to-white text-2xl text-rosewood shadow-[0_14px_35px_-24px_rgba(169,79,115,0.7)]" aria-hidden="true"><FiLock /></span>
      <p className="mt-5 text-[.68rem] font-semibold uppercase tracking-[.24em] text-gold">Identity confirmed</p>
      <h1 className="mt-2 font-serif text-3xl font-semibold sm:text-4xl">Create a new password</h1>
      <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-muted">{location.state?.verifiedEmail ? <>Your email has been verified. </> : null}Choose a secure password you haven’t used for this account.</p>
    </div>

    {error && <p role="alert" className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error.message}</p>}

    <form onSubmit={handleSubmit(submit)} className="mt-7 space-y-5">
      <PasswordInput label="New password" autoComplete="new-password" placeholder="Enter a strong new password" error={errors.password?.message} {...register('password')} />
      <PasswordInput label="Confirm new password" autoComplete="new-password" placeholder="Re-enter your new password" error={errors.confirmPassword?.message} {...register('confirmPassword')} />

      <ul className="grid gap-2 rounded-2xl bg-blue-light/30 px-4 py-3 text-xs text-muted sm:grid-cols-2">
        {requirementItems.map((item) => <li key={item} className="flex items-center gap-2"><span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-white text-[.65rem] text-rosewood"><FiCheck aria-hidden="true" /></span>{item}</li>)}
      </ul>

      <LoadingButton type="submit" loading={isLoading}><FiShield aria-hidden="true" /> Save New Password</LoadingButton>
      <p className="text-center text-xs leading-5 text-muted">After updating, your other signed-in sessions will be securely closed.</p>
    </form>
  </>
}

export default ResetPasswordPage
