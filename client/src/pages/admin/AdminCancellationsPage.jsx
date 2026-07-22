import { useCallback, useState } from 'react'
import { FiSearch } from 'react-icons/fi'
import AdminPageHeader from '../../components/admin/AdminPageHeader.jsx'
import AdminPagination from '../../components/admin/AdminPagination.jsx'
import DataTable from '../../components/admin/DataTable.jsx'
import { useAdminQuery } from '../../hooks/useAdminQuery.js'
import { adminApi } from '../../services/adminApi.js'

function AdminCancellationsPage() {
  const [query, setQuery] = useState({ page: 1, search: '' })
  const fetcher = useCallback(() => adminApi.list('orders/cancellations', query), [query])
  const { data, loading, error } = useAdminQuery(fetcher, [fetcher])
  const columns = [
    { key: 'order', label: 'Order', render: (row) => <div><strong>{row.orderNumber}</strong><p className="text-xs text-muted">{new Date(row.cancellation?.cancelledAt || row.updatedAt).toLocaleString()}</p></div> },
    { key: 'customer', label: 'Customer', render: (row) => <div><p className="font-medium">{row.user ? `${row.user.firstName} ${row.user.lastName}` : 'Deleted customer'}</p><p className="break-all text-xs text-muted">{row.user?.email}</p></div> },
    { key: 'products', label: 'Cancelled products', sortable: false, render: (row) => <ul className="space-y-1">{row.items.map((item) => <li key={item.id || item._id} className="text-sm"><strong>{item.name}</strong><span className="block text-xs text-muted">Size {item.size} · Qty {item.quantity}</span></li>)}</ul> },
    { key: 'reason', label: 'Cancellation reason', sortable: false, render: (row) => <p className="max-w-md whitespace-pre-wrap text-sm leading-6">{row.cancellation?.reason || 'Reason was not recorded for this older cancellation.'}</p> },
    { key: 'cancelledBy', label: 'Cancelled by', render: (row) => <div><p className="font-medium">{row.cancellation?.cancelledBy ? `${row.cancellation.cancelledBy.firstName} ${row.cancellation.cancelledBy.lastName}` : row.cancellation?.cancelledByRole === 'customer' ? 'Customer' : 'Not recorded'}</p><p className="text-xs capitalize text-muted">{row.cancellation?.cancelledByRole || 'Legacy cancellation'}</p></div> },
  ]

  return (
    <div className="space-y-6">
      <AdminPageHeader title="Order Cancellations" description="A view-only record of who cancelled each order, the affected products, and the customer’s reason." />
      <section className="overflow-hidden rounded-[1.75rem] border border-gold/15 bg-white">
        <div className="p-4 sm:max-w-md"><label className="relative block"><FiSearch className="absolute left-4 top-4 text-muted" /><input className="input-field pl-11" value={query.search} onChange={(event) => setQuery({ page: 1, search: event.target.value })} placeholder="Search order, customer, product or reason…" /></label></div>
        {error ? <p className="p-5 text-red-600">{error}</p> : <DataTable columns={columns} rows={data?.orders} loading={loading} emptyTitle="No cancelled orders" />}
        <AdminPagination pagination={data?.pagination} onPage={(page) => setQuery((current) => ({ ...current, page }))} />
      </section>
    </div>
  )
}

export default AdminCancellationsPage
