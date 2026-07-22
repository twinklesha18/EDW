import { yupResolver } from '@hookform/resolvers/yup'
import { useCallback, useEffect, useState } from 'react'
import { FiEdit2, FiKey, FiPlus, FiPower, FiTrash2 } from 'react-icons/fi'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import AdminFormModal from '../../components/admin/AdminFormModal.jsx'
import AdminPageHeader from '../../components/admin/AdminPageHeader.jsx'
import AdminPagination from '../../components/admin/AdminPagination.jsx'
import DataTable from '../../components/admin/DataTable.jsx'
import StatusBadge from '../../components/admin/StatusBadge.jsx'
import ConfirmModal from '../../components/common/ConfirmModal.jsx'
import FormInput from '../../components/common/FormInput.jsx'
import LoadingButton from '../../components/common/LoadingButton.jsx'
import PasswordInput from '../../components/common/PasswordInput.jsx'
import { useAdminQuery } from '../../hooks/useAdminQuery.js'
import { adminApi } from '../../services/adminApi.js'
import { getApiError } from '../../services/api.js'
import { adminUserCreateSchema, adminUserPasswordSchema, adminUserUpdateSchema } from '../../utils/validationSchemas.js'

const blankUser = { firstName: '', lastName: '', email: '', phone: '', role: 'user', isActive: true, password: '', confirmPassword: '' }

function applyServerErrors(error, setError, fallback) {
  const details = getApiError(error, fallback)
  details.errors.forEach((entry) => setError(entry.field, { type: 'server', message: entry.message }))
  toast.error(details.errors[0]?.message || details.message)
}

function UserEditor({ user, onClose, onSaved }) {
  const creating = !user?.id
  const [saving, setSaving] = useState(false)
  const { register, reset, handleSubmit, setError, formState: { errors } } = useForm({
    resolver: yupResolver(creating ? adminUserCreateSchema : adminUserUpdateSchema),
    defaultValues: blankUser,
  })

  useEffect(() => {
    reset(creating ? blankUser : {
      firstName: user.firstName, lastName: user.lastName, email: user.email, phone: user.phone,
      role: user.role, isActive: user.isActive,
    })
  }, [creating, reset, user])

  const save = async (values) => {
    setSaving(true)
    try {
      if (creating) await adminApi.create('users', values)
      else await adminApi.update('users', user.id, values)
      toast.success(creating ? 'User created successfully.' : 'User updated successfully.')
      onSaved()
    } catch (error) { applyServerErrors(error, setError, 'Unable to save the user.') }
    finally { setSaving(false) }
  }

  return <AdminFormModal open title={creating ? 'Create User' : `Edit ${user.firstName} ${user.lastName}`} onClose={onClose}>
    <form onSubmit={handleSubmit(save)} className="grid gap-4 sm:grid-cols-2" noValidate>
      <FormInput label="First name" placeholder="Enter first name" autoComplete="off" maxLength={60} error={errors.firstName?.message} {...register('firstName')} />
      <FormInput label="Last name" placeholder="Enter last name" autoComplete="off" maxLength={60} error={errors.lastName?.message} {...register('lastName')} />
      <FormInput label="Email address" placeholder="name@example.com" type="email" inputMode="email" autoComplete="off" maxLength={160} error={errors.email?.message} {...register('email')} />
      <FormInput label="Phone number" placeholder="Enter 10-digit phone number" type="tel" inputMode="numeric" autoComplete="off" maxLength={10} error={errors.phone?.message} {...register('phone')} />
      <label><span className="form-label">Role</span><select className={`input-field ${errors.role ? 'border-red-400' : ''}`} {...register('role')}><option value="user">Customer</option><option value="admin">Administrator</option></select>{errors.role && <span className="mt-1.5 block text-xs text-red-600">{errors.role.message}</span>}</label>
      <label className="flex min-h-12 items-center gap-3 self-end rounded-xl border border-gold/20 px-4 text-sm"><input type="checkbox" className="accent-rosewood" {...register('isActive')} /><span>Account is active</span></label>
      {creating && <><PasswordInput label="Temporary password" placeholder="Create a secure password" autoComplete="new-password" error={errors.password?.message} {...register('password')} /><PasswordInput label="Confirm password" placeholder="Re-enter the password" autoComplete="new-password" error={errors.confirmPassword?.message} {...register('confirmPassword')} /><p className="text-xs leading-5 text-muted sm:col-span-2">Use 8–72 characters with uppercase, lowercase, and a number. Give the password to the account owner securely.</p></>}
      <div className="flex flex-col-reverse gap-3 pt-2 sm:col-span-2 sm:flex-row sm:justify-end"><button type="button" className="secondary-button" onClick={onClose}>Cancel</button><LoadingButton type="submit" loading={saving} className="primary-button">{creating ? 'Create Account' : 'Save Changes'}</LoadingButton></div>
    </form>
  </AdminFormModal>
}

function PasswordEditor({ user, onClose, onSaved }) {
  const [saving, setSaving] = useState(false)
  const { register, handleSubmit, setError, formState: { errors } } = useForm({ resolver: yupResolver(adminUserPasswordSchema), defaultValues: { password: '', confirmPassword: '' } })
  const save = async (values) => {
    setSaving(true)
    try {
      await adminApi.update('users', `${user.id}/password`, values)
      toast.success('Password changed. Existing sessions were signed out.')
      onSaved()
    } catch (error) { applyServerErrors(error, setError, 'Unable to change the password.') }
    finally { setSaving(false) }
  }
  return <AdminFormModal open title={`Change Password — ${user.firstName} ${user.lastName}`} onClose={onClose} maxWidth="max-w-lg">
    <form onSubmit={handleSubmit(save)} className="space-y-4" noValidate>
      <PasswordInput label="New password" placeholder="Enter a new secure password" autoComplete="new-password" error={errors.password?.message} {...register('password')} />
      <PasswordInput label="Confirm new password" placeholder="Re-enter the new password" autoComplete="new-password" error={errors.confirmPassword?.message} {...register('confirmPassword')} />
      <p className="rounded-xl bg-amber-50 p-3 text-xs leading-5 text-amber-900">Changing the password immediately signs this account out from existing sessions.</p>
      <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end"><button type="button" className="secondary-button" onClick={onClose}>Cancel</button><LoadingButton type="submit" loading={saving} className="primary-button">Change Password</LoadingButton></div>
    </form>
  </AdminFormModal>
}

function AdminUsersPage() {
  const [query, setQuery] = useState({ page: 1, search: '', role: '', status: '' })
  const [editor, setEditor] = useState(null)
  const [passwordUser, setPasswordUser] = useState(null)
  const [action, setAction] = useState(null)
  const [actionLoading, setActionLoading] = useState(false)
  const fetcher = useCallback(() => adminApi.list('users', query), [query])
  const { data, loading, error, reload } = useAdminQuery(fetcher, [fetcher])

  const closeAndReload = () => { setEditor(null); setPasswordUser(null); reload() }
  const confirmAction = async () => {
    if (!action?.row) return
    setActionLoading(true)
    try {
      if (action.type === 'delete') {
        await adminApi.remove('users', action.row.id)
        toast.success('User and all associated records deleted. The activity was logged.')
      } else {
        await adminApi.update('users', `${action.row.id}/access`, { isActive: !action.row.isActive })
        toast.success(action.row.isActive ? 'User account deactivated.' : 'User account activated.')
      }
      setAction(null); reload()
    } catch (requestError) { toast.error(requestError.response?.data?.message || 'Unable to complete this action.') }
    finally { setActionLoading(false) }
  }

  const columns = [
    { key: 'user', label: 'User', render: (row) => <div><p className="font-semibold">{row.firstName} {row.lastName}</p><p className="break-all text-xs text-muted">{row.email}</p></div> },
    { key: 'phone', label: 'Phone' },
    { key: 'role', label: 'Role', render: (row) => <StatusBadge>{row.role === 'admin' ? 'Admin' : 'Customer'}</StatusBadge> },
    { key: 'status', label: 'Status', render: (row) => <StatusBadge>{row.isActive ? 'Active' : 'Inactive'}</StatusBadge> },
    { key: 'joined', label: 'Joined', render: (row) => new Date(row.createdAt).toLocaleDateString() },
    { key: 'actions', label: 'Actions', render: (row) => <div className="flex flex-wrap gap-1"><button type="button" className="icon-button" onClick={() => setEditor(row)} title="View and edit user" aria-label={`Edit ${row.firstName}`}><FiEdit2 /></button><button type="button" className="icon-button text-rosewood" onClick={() => setPasswordUser(row)} title="Change password" aria-label={`Change password for ${row.firstName}`}><FiKey /></button><button type="button" className={`icon-button ${row.isActive ? 'text-amber-700' : 'text-emerald-700'}`} onClick={() => setAction({ type: 'status', row })} title={row.isActive ? 'Deactivate account' : 'Activate account'} aria-label={`${row.isActive ? 'Deactivate' : 'Activate'} ${row.firstName}`}><FiPower /></button><button type="button" className="icon-button text-red-600" onClick={() => setAction({ type: 'delete', row })} title="Delete user" aria-label={`Delete ${row.firstName}`}><FiTrash2 /></button></div> },
  ]

  const actionName = action?.row ? `${action.row.firstName} ${action.row.lastName}` : 'this user'
  const deleting = action?.type === 'delete'

  return <div className="space-y-6">
    <AdminPageHeader title="Users" description="Create, view, update, secure, activate, deactivate, and delete customer or administrator accounts." action={<button type="button" className="primary-button" onClick={() => setEditor({})}><FiPlus /> New User</button>} />
    <div className="overflow-hidden rounded-[1.75rem] border border-gold/15 bg-white">
      <div className="grid gap-3 p-4 sm:grid-cols-3"><input className="input-field" maxLength={160} placeholder="Search name, email, phone…" value={query.search} onChange={(event) => setQuery((current) => ({ ...current, search: event.target.value, page: 1 }))} /><select className="input-field" value={query.role} onChange={(event) => setQuery((current) => ({ ...current, role: event.target.value, page: 1 }))}><option value="">All roles</option><option value="user">Customers</option><option value="admin">Administrators</option></select><select className="input-field" value={query.status} onChange={(event) => setQuery((current) => ({ ...current, status: event.target.value, page: 1 }))}><option value="">All statuses</option><option value="active">Active</option><option value="inactive">Inactive</option></select></div>
      {error ? <p className="p-5 text-red-600">{error}</p> : <DataTable columns={columns} rows={data?.users} loading={loading} emptyTitle="No users found" />}
      <AdminPagination pagination={data?.pagination} onPage={(page) => setQuery((current) => ({ ...current, page }))} />
      <p className="border-t border-gold/10 p-4 text-xs leading-5 text-muted">Deleting an account also permanently removes its orders, custom orders, reviews, addresses, cart, wishlist, payment slips, and notifications. A minimal view-only record is retained in Deletion Logs.</p>
    </div>
    {editor && <UserEditor user={editor} onClose={() => setEditor(null)} onSaved={closeAndReload} />}
    {passwordUser && <PasswordEditor user={passwordUser} onClose={() => setPasswordUser(null)} onSaved={closeAndReload} />}
    <ConfirmModal open={Boolean(action)} title={deleting ? `Delete ${actionName} and all records?` : `${action?.row?.isActive ? 'Deactivate' : 'Activate'} ${actionName}?`} message={deleting ? 'This permanently deletes the account, addresses, orders, custom orders, reviews, payment slips, cart, wishlist, and notifications. Only a minimal deletion audit log remains. This cannot be undone.' : action?.row?.isActive ? 'The account will be signed out and blocked until an administrator activates it.' : 'The account will regain login access.'} confirmLabel={deleting ? 'Delete User & All Records' : action?.row?.isActive ? 'Deactivate Account' : 'Activate Account'} onConfirm={confirmAction} onClose={() => setAction(null)} loading={actionLoading} />
  </div>
}

export default AdminUsersPage
