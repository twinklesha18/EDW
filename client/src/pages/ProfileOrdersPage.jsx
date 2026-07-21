import { useCallback, useEffect, useState } from 'react'
import { FiEye, FiSearch } from 'react-icons/fi'
import { Link } from 'react-router-dom'
import AdminPagination from '../components/admin/AdminPagination.jsx'
import StatusBadge from '../components/admin/StatusBadge.jsx'
import EmptyState from '../components/common/EmptyState.jsx'
import LoadingSkeleton from '../components/common/LoadingSkeleton.jsx'
import { checkoutApi } from '../services/checkoutApi.js'
import { formatCurrency } from '../utils/formatCurrency.js'

const statuses = ['', 'Pending', 'Confirmed', 'Processing', 'Packed', 'Shipped', 'Delivered', 'Cancelled']
function ProfileOrdersPage() {
  const [query, setQuery] = useState({ page: 1, search: '', status: '' }), [data, setData] = useState(null), [loading, setLoading] = useState(true), [error, setError] = useState('')
  const load = useCallback(async () => { setLoading(true); try { setData(await checkoutApi.listOrders(query)); setError('') } catch (requestError) { setError(requestError.response?.data?.message || 'Unable to load orders.') } finally { setLoading(false) } }, [query])
  useEffect(() => { void load() }, [load])
  return <div className="form-section"><div className="flex flex-wrap items-end justify-between gap-4"><div><h2 className="font-serif text-3xl font-semibold">My Orders</h2><p className="mt-1 text-sm text-muted">View, track, cancel, reorder, or download invoices.</p></div></div><div className="mt-6 grid gap-3 sm:grid-cols-[1fr_220px]"><label className="relative"><FiSearch className="absolute left-4 top-4 text-muted" /><input className="input-field pl-11" placeholder="Search order number…" value={query.search} onChange={(event) => setQuery((current) => ({ ...current, search: event.target.value, page: 1 }))} /></label><select className="input-field" value={query.status} onChange={(event) => setQuery((current) => ({ ...current, status: event.target.value, page: 1 }))}>{statuses.map((status) => <option key={status || 'all'} value={status}>{status || 'All statuses'}</option>)}</select></div>{loading ? <LoadingSkeleton /> : error ? <p className="mt-5 rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</p> : !data?.orders?.length ? <div className="mt-6"><EmptyState title="No orders found" message="Completed checkouts will appear here." action={<Link to="/shop" className="primary-button">Start Shopping</Link>} /></div> : <div className="mt-6 space-y-4">{data.orders.map((order) => <article key={order.id || order._id} className="rounded-2xl border border-gold/15 p-5"><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="font-semibold">{order.orderNumber}</p><p className="mt-1 text-xs text-muted">{new Date(order.createdAt).toLocaleString()} · {order.items.reduce((sum, item) => sum + item.quantity, 0)} item(s)</p></div><div className="flex gap-2"><StatusBadge>{order.paymentStatus}</StatusBadge><StatusBadge>{order.orderStatus}</StatusBadge></div></div><div className="mt-4 flex flex-wrap items-center justify-between gap-4 border-t border-gold/10 pt-4"><div><p className="text-xs text-muted">Order total</p><p className="font-serif text-xl font-semibold text-rosewood">{formatCurrency(order.total)}</p></div><Link to={`/orders/${order.orderNumber}`} className="secondary-button min-h-10"><FiEye /> View & Track</Link></div></article>)}</div>}<AdminPagination pagination={data?.pagination} onPage={(page) => setQuery((current) => ({ ...current, page }))} /></div>
}
export default ProfileOrdersPage
