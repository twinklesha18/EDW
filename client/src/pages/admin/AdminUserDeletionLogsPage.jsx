import { useCallback, useState } from 'react'
import { FiSearch, FiShield } from 'react-icons/fi'
import AdminPageHeader from '../../components/admin/AdminPageHeader.jsx'
import AdminPagination from '../../components/admin/AdminPagination.jsx'
import DataTable from '../../components/admin/DataTable.jsx'
import StatusBadge from '../../components/admin/StatusBadge.jsx'
import { useAdminQuery } from '../../hooks/useAdminQuery.js'
import { adminApi } from '../../services/adminApi.js'

const recordSummary = (counts = {}) => [
  `${counts.normalOrders || 0} orders`, `${counts.customOrders || 0} custom orders`, `${counts.reviews || 0} reviews`,
  `${counts.addresses || 0} addresses`, `${counts.cartItems || 0} cart items`, `${counts.wishlistItems || 0} wishlist items`,
  `${counts.notifications || 0} notifications`,
].join(' · ')

function AdminUserDeletionLogsPage() {
  const [query, setQuery] = useState({ page: 1, search: '', status: '' })
  const fetcher = useCallback(() => adminApi.list('user-deletion-logs', query), [query])
  const { data, loading, error } = useAdminQuery(fetcher)
  const columns = [
    { key: 'deletedUser', label: 'Deleted account', render: (row) => <div><strong>{row.deletedUser.name}</strong><p className="break-all text-xs text-muted">{row.deletedUser.email}</p><p className="text-xs text-muted">{row.deletedUser.role === 'admin' ? 'Administrator' : 'Customer'}</p></div> },
    { key: 'deletedAt', label: 'Deleted at', sortValue: (row) => row.completedAt || row.createdAt, render: (row) => <div><p>{new Date(row.completedAt || row.createdAt).toLocaleString()}</p><p className="text-xs text-muted">Started {new Date(row.createdAt).toLocaleString()}</p></div> },
    { key: 'performedBy', label: 'Deleted by', render: (row) => <div><p className="font-medium">{row.performedBySnapshot.name}</p><p className="break-all text-xs text-muted">{row.performedBySnapshot.email}</p></div> },
    { key: 'records', label: 'Records removed', sortable: false, render: (row) => <div className="max-w-md"><p className="text-xs leading-5">{recordSummary(row.counts)}</p>{(row.orderNumbers?.length > 0 || row.customOrderNumbers?.length > 0) && <details className="mt-2"><summary className="cursor-pointer text-xs font-semibold text-rosewood">View deleted order references</summary><div className="mt-2 space-y-1 text-xs text-muted">{row.orderNumbers?.map((number) => <p key={number}>{number}</p>)}{row.customOrderNumbers?.map((number) => <p key={number}>{number}</p>)}{row.referencesTruncated && <p>Additional references were truncated.</p>}</div></details>}</div> },
    { key: 'status', label: 'Status', render: (row) => <div><StatusBadge>{row.status}</StatusBadge>{row.failureMessage && <p className="mt-2 max-w-xs text-xs leading-5 text-amber-700">{row.failureMessage}</p>}</div> },
  ]

  return <div className="space-y-6">
    <AdminPageHeader title="User Deletion Logs" description="A permanent, view-only audit trail of cascade user deletions and the records removed with each account." />
    <div className="flex items-start gap-3 rounded-2xl border border-gold/20 bg-cream p-4 text-sm text-muted"><FiShield className="mt-0.5 shrink-0 text-rosewood" /><p>These logs cannot be edited or deleted from the dashboard. Passwords, addresses, payment details, and uploaded slips are never copied into the audit log.</p></div>
    <section className="overflow-hidden rounded-[1.75rem] border border-gold/15 bg-white">
      <div className="grid gap-3 p-4 sm:grid-cols-[minmax(0,1fr)_220px]"><label className="relative block"><FiSearch className="absolute left-4 top-4 text-muted" /><input className="input-field pl-11" maxLength={160} value={query.search} onChange={(event) => setQuery((current) => ({ ...current, page: 1, search: event.target.value }))} placeholder="Search deleted user, admin, or order…" /></label><select className="input-field" value={query.status} onChange={(event) => setQuery((current) => ({ ...current, page: 1, status: event.target.value }))}><option value="">All statuses</option><option>Completed</option><option>Failed</option><option>In Progress</option></select></div>
      {error ? <p className="p-5 text-red-600">{error}</p> : <DataTable columns={columns} rows={data?.logs} loading={loading} emptyTitle="No user deletion activity" />}
      <AdminPagination pagination={data?.pagination} onPage={(page) => setQuery((current) => ({ ...current, page }))} />
    </section>
  </div>
}

export default AdminUserDeletionLogsPage
