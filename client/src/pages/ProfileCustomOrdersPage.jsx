import { useEffect, useState } from 'react'
import { FiCalendar, FiClipboard, FiEye, FiPlus } from 'react-icons/fi'
import { Link } from 'react-router-dom'
import AdminPagination from '../components/admin/AdminPagination.jsx'
import StatusBadge from '../components/admin/StatusBadge.jsx'
import EmptyState from '../components/common/EmptyState.jsx'
import LoadingSkeleton from '../components/common/LoadingSkeleton.jsx'
import api from '../services/api.js'
import { formatCurrency } from '../utils/formatCurrency.js'

function ProfileCustomOrdersPage() {
  const [page, setPage] = useState(1)
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    setLoading(true)
    setError('')
    api.get('/custom-orders', { params: { page } })
      .then((response) => active && setData(response.data.data))
      .catch((requestError) => active && setError(requestError.response?.data?.message || 'Unable to load your custom orders.'))
      .finally(() => active && setLoading(false))
    return () => { active = false }
  }, [page])

  return (
    <div className="form-section">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-serif text-3xl font-semibold">My Custom Orders</h2>
          <p className="mt-1 text-sm text-muted">Track your design requests, quotes, and progress.</p>
        </div>
        <Link to="/custom-orders" className="primary-button"><FiPlus /> Place Custom Order</Link>
      </div>

      {loading ? <div className="mt-6"><LoadingSkeleton /></div> : error ? (
        <p className="mt-6 rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</p>
      ) : !data?.customOrders?.length ? (
        <div className="mt-6"><EmptyState title="No custom orders yet" message="Share your idea and we will create something especially for you." action={<Link to="/custom-orders" className="primary-button"><FiClipboard /> Start a Custom Order</Link>} /></div>
      ) : (
        <div className="mt-6 space-y-4">
          {data.customOrders.map((order) => (
            <article key={order.id || order._id} className="rounded-2xl border border-gold/15 bg-white p-4 sm:p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-ink">{order.requestNumber}</p>
                  <p className="mt-1 text-xs text-muted">Submitted {new Date(order.createdAt).toLocaleString()}</p>
                </div>
                <StatusBadge>{order.status}</StatusBadge>
              </div>
              <dl className="mt-4 grid gap-3 border-t border-gold/10 pt-4 text-sm sm:grid-cols-2 xl:grid-cols-4">
                <div><dt className="text-xs text-muted">Gift</dt><dd className="mt-1 font-medium">{order.bouquetType || order.giftType}</dd></div>
                <div><dt className="text-xs text-muted">Occasion</dt><dd className="mt-1 font-medium">{order.occasion}</dd></div>
                <div><dt className="text-xs text-muted">Required date</dt><dd className="mt-1 flex items-center gap-2 font-medium"><FiCalendar className="text-rosewood" />{new Date(order.requiredDate).toLocaleDateString()}</dd></div>
                <div><dt className="text-xs text-muted">Quote</dt><dd className="mt-1 font-medium text-rosewood">{order.quotedPrice === null ? 'Awaiting quote' : formatCurrency(order.quotedPrice)}</dd></div>
              </dl>
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3"><div className="flex items-center gap-2 text-xs text-muted"><span>Payment:</span><StatusBadge>{order.paymentStatus || 'Not Selected'}</StatusBadge></div><Link to={`/profile/custom-orders/${order.id || order._id}`} className="secondary-button min-h-10"><FiEye /> View & Track</Link></div>
              {order.adminNote && <div className="mt-4 rounded-xl bg-pink-light/40 p-3 text-sm"><span className="font-semibold">Update from Eshaz:</span> <span className="text-muted">{order.adminNote}</span></div>}
            </article>
          ))}
        </div>
      )}
      <AdminPagination pagination={data?.pagination} onPage={setPage} />
    </div>
  )
}

export default ProfileCustomOrdersPage
