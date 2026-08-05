import { yupResolver } from '@hookform/resolvers/yup'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { FiLock, FiLogOut, FiTrash2 } from 'react-icons/fi'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import ConfirmModal from '../components/common/ConfirmModal.jsx'
import LoadingButton from '../components/common/LoadingButton.jsx'
import PasswordInput from '../components/common/PasswordInput.jsx'
import { changePassword, sessionExpired } from '../redux/slices/authSlice.js'
import api, { getApiError } from '../services/api.js'
import { changePasswordSchema } from '../utils/validationSchemas.js'

const sessionEventKey = 'edw_session_expired_at'

function ProfileSettingsPage() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { user, isLoading, error } = useSelector((state) => state.auth)
  const [action, setAction] = useState('')
  const [actionLoading, setActionLoading] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [actionError, setActionError] = useState('')
  const { register, reset, handleSubmit, formState: { errors } } = useForm({ resolver: yupResolver(changePasswordSchema) })

  const save = async (values) => {
    try {
      await dispatch(changePassword(values)).unwrap()
      reset()
      toast.success('Password changed successfully.')
    } catch { /* The API error is displayed below. */ }
  }

  const closeAction = () => {
    if (actionLoading) return
    setAction('')
    setCurrentPassword('')
    setConfirmation('')
    setActionError('')
  }

  const openAction = (nextAction) => {
    setAction(nextAction)
    setCurrentPassword('')
    setConfirmation('')
    setActionError('')
  }

  const finishSession = (message, destination) => {
    dispatch(sessionExpired())
    localStorage.setItem(sessionEventKey, String(Date.now()))
    toast.success(message)
    navigate(destination, { replace: true })
  }

  const confirmAction = async () => {
    if (!currentPassword) {
      setActionError('Enter your current password to continue.')
      return
    }
    if (action === 'delete' && confirmation !== 'DELETE') {
      setActionError('Type DELETE exactly to confirm permanent account deletion.')
      return
    }

    setActionLoading(true)
    setActionError('')
    try {
      if (action === 'logout') {
        await api.post('/users/sessions/revoke-all', { currentPassword })
        finishSession('You have been logged out from all devices.', '/login')
      } else {
        await api.delete('/users/account', { data: { currentPassword, confirmation } })
        finishSession('Your account and associated data were deleted.', '/')
      }
    } catch (requestError) {
      setActionError(getApiError(requestError, `Unable to ${action === 'logout' ? 'log out all devices' : 'delete your account'}.`).message)
    } finally {
      setActionLoading(false)
    }
  }

  const deleting = action === 'delete'

  return <>
    <div className="grid gap-6 xl:grid-cols-2">
      <section className="form-section">
        <h2 className="form-section-title"><span><FiLock /></span> Change Password</h2>
        {error && <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error.message}</p>}
        <form onSubmit={handleSubmit(save)} className="mt-6 space-y-4">
          <PasswordInput label="Current password" autoComplete="current-password" error={errors.currentPassword?.message} {...register('currentPassword')} />
          <PasswordInput label="New password" autoComplete="new-password" error={errors.newPassword?.message} {...register('newPassword')} />
          <PasswordInput label="Confirm new password" autoComplete="new-password" error={errors.confirmNewPassword?.message} {...register('confirmNewPassword')} />
          <LoadingButton loading={isLoading} type="submit" className="primary-button">Update Password</LoadingButton>
        </form>
      </section>

      <section className="space-y-6">
        <div className="form-section">
          <h2 className="font-serif text-2xl font-semibold">Account information</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <div><dt className="text-xs text-muted">Name</dt><dd>{user.fullName}</dd></div>
            <div><dt className="text-xs text-muted">Email</dt><dd className="break-all">{user.email}</dd></div>
            <div><dt className="text-xs text-muted">Member since</dt><dd>{new Date(user.createdAt).toLocaleDateString()}</dd></div>
          </dl>
        </div>

        <div className="form-section">
          <h2 className="font-serif text-2xl font-semibold">Advanced account actions</h2>
          <p className="mt-3 text-sm leading-6 text-muted">Securely end every active session or permanently remove your customer account and associated records.</p>
          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <button type="button" className="secondary-button w-full sm:w-auto" onClick={() => openAction('logout')}><FiLogOut /> Logout all devices</button>
            <button type="button" className="secondary-button w-full border-red-200 text-red-600 hover:border-red-300 hover:bg-red-50 sm:w-auto" onClick={() => openAction('delete')}><FiTrash2 /> Delete account</button>
          </div>
        </div>
      </section>
    </div>

    <ConfirmModal
      open={Boolean(action)}
      title={deleting ? 'Permanently delete your account?' : 'Logout from all devices?'}
      message={deleting
        ? 'This permanently deletes your profile, addresses, orders, custom orders, reviews, cart, wishlist, notifications, and uploaded payment files. This cannot be undone.'
        : 'Every active login session, including this device, will end immediately.'}
      confirmLabel={deleting ? 'Delete My Account' : 'Logout All Devices'}
      onConfirm={confirmAction}
      onClose={closeAction}
      loading={actionLoading}
    >
      <div className="space-y-4">
        {actionError && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{actionError}</p>}
        <PasswordInput
          label="Current password"
          name="accountActionPassword"
          value={currentPassword}
          onChange={(event) => setCurrentPassword(event.target.value)}
          autoComplete="current-password"
          placeholder="Enter your current password"
          autoFocus
        />
        {deleting && <label className="block">
          <span className="form-label">Type DELETE to confirm</span>
          <input
            className="input-field"
            value={confirmation}
            onChange={(event) => setConfirmation(event.target.value)}
            autoComplete="off"
            placeholder="DELETE"
          />
        </label>}
      </div>
    </ConfirmModal>
  </>
}

export default ProfileSettingsPage
