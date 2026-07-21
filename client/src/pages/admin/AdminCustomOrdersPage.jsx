import { useCallback, useState } from 'react'
import { FiEye, FiSearch } from 'react-icons/fi'
import { Link } from 'react-router-dom'
import AdminPageHeader from '../../components/admin/AdminPageHeader.jsx'
import AdminPagination from '../../components/admin/AdminPagination.jsx'
import DataTable from '../../components/admin/DataTable.jsx'
import StatusBadge from '../../components/admin/StatusBadge.jsx'
import { useAdminQuery } from '../../hooks/useAdminQuery.js'
import { adminApi } from '../../services/adminApi.js'

const statuses = ['', 'Pending', 'Reviewing', 'Quoted', 'Approved', 'In Progress', 'Completed', 'Rejected', 'Cancelled']

function AdminCustomOrdersPage() {
  const [query, setQuery] = useState({ page: 1, search: '', status: '' })
  const fetcher = useCallback(() => adminApi.list('custom-orders', query), [query])
  const { data, loading, error } = useAdminQuery(fetcher)
  const columns = [
    {
      key: 'request',
      label: 'Request',
      render: (row) => <div><strong>{row.requestNumber}</strong><p className="text-xs text-muted">{new Date(row.createdAt).toLocaleDateString()}</p></div>,
    },
    {
      key: 'customer',
      label: 'Customer',
      render: (row) => row.user
        ? <div><p>{row.user.firstName} {row.user.lastName}</p><p className="break-all text-xs text-muted">{row.user.email}</p></div>
        : 'Deleted customer',
    },
    { key: 'giftType', label: 'Gift Type' },
    { key: 'occasion', label: 'Occasion' },
    { key: 'requiredDate', label: 'Required Date', render: (row) => new Date(row.requiredDate).toLocaleDateString() },
    { key: 'budgetRange', label: 'Budget' },
    { key: 'status', label: 'Status', render: (row) => <StatusBadge>{row.status}</StatusBadge> },
    {
      key: 'view',
      label: '',
      sortable: false,
      render: (row) => <Link to={`/admin/custom-orders/${row.id}`} className="icon-button" aria-label={`View ${row.requestNumber}`}><FiEye /></Link>,
    },
  ]

  return (
    <div className="space-y-6">
      <AdminPageHeader title="Custom Orders" description="Review customer design requests, provide pricing, and manage their progress." />
      <div className="overflow-hidden rounded-[1.75rem] border border-gold/15 bg-white">
        <div className="grid gap-3 p-4 sm:grid-cols-[minmax(0,1fr)_240px]">
          <label className="relative">
            <FiSearch className="absolute left-4 top-4 text-muted" />
            <input className="input-field pl-11" placeholder="Search reference or customer…" value={query.search} onChange={(event) => setQuery((current) => ({ ...current, search: event.target.value, page: 1 }))} />
          </label>
          <select className="input-field" value={query.status} onChange={(event) => setQuery((current) => ({ ...current, status: event.target.value, page: 1 }))}>
            {statuses.map((status) => <option key={status || 'all'} value={status}>{status || 'All statuses'}</option>)}
          </select>
        </div>
        {error
          ? <p className="p-5 text-sm text-red-600">{error}</p>
          : <DataTable columns={columns} rows={data?.customOrders} loading={loading} emptyTitle="No custom orders found" />}
        <AdminPagination pagination={data?.pagination} onPage={(page) => setQuery((current) => ({ ...current, page }))} />
      </div>
    </div>
  )
}

export default AdminCustomOrdersPage
