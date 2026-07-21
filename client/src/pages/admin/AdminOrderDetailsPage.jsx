import { useEffect, useState } from 'react'
import { FiArrowLeft, FiDownload, FiMapPin, FiPackage, FiTruck, FiUser } from 'react-icons/fi'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { Link, useParams } from 'react-router-dom'
import AdminPageHeader from '../../components/admin/AdminPageHeader.jsx'
import StatusBadge from '../../components/admin/StatusBadge.jsx'
import LoadingButton from '../../components/common/LoadingButton.jsx'
import OrderTimeline from '../../components/order/OrderTimeline.jsx'
import { adminApi } from '../../services/adminApi.js'
import { downloadBlob } from '../../services/checkoutApi.js'
import { formatCurrency } from '../../utils/formatCurrency.js'

const statuses = ['Pending', 'Confirmed', 'Processing', 'Packed', 'Shipped', 'Delivered', 'Cancelled']

function AdminOrderDetailsPage() {
  const { id } = useParams()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const { register, reset, handleSubmit } = useForm()

  useEffect(() => {
    adminApi.get('orders', id)
      .then(({ order: value }) => { setOrder(value); reset({ orderStatus: value.orderStatus, paymentStatus: value.paymentStatus, trackingNumber: value.trackingNumber, notes: value.notes }) })
      .catch((requestError) => setError(requestError.response?.data?.message || 'Unable to load order.'))
      .finally(() => setLoading(false))
  }, [id, reset])

  const save = async (values) => {
    setSaving(true)
    try {
      const response = await adminApi.update('orders', id, values)
      setOrder(response.data.order)
      reset({ orderStatus: response.data.order.orderStatus, paymentStatus: response.data.order.paymentStatus, trackingNumber: response.data.order.trackingNumber, notes: response.data.order.notes })
      toast.success('Order updated successfully.')
    } catch (requestError) { toast.error(requestError.response?.data?.message || 'Unable to update order.') }
    finally { setSaving(false) }
  }

  const invoice = async () => { try { downloadBlob(await adminApi.invoice(id), `${order.orderNumber}-invoice.pdf`) } catch { toast.error('Unable to download invoice.') } }

  if (loading) return <p className="p-10 text-center text-muted">Loading order…</p>
  if (error || !order) return <p className="rounded-xl bg-red-50 p-5 text-red-700">{error}</p>
  const address = order.shippingAddress

  return (
    <div className="space-y-6">
      <AdminPageHeader title={order.orderNumber} description={`Placed ${new Date(order.createdAt).toLocaleString()}`} action={<div className="flex gap-2"><button type="button" className="secondary-button" onClick={invoice}><FiDownload /> Invoice</button><Link to="/admin/orders" className="secondary-button"><FiArrowLeft /> Orders</Link></div>} />
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
          <section className="form-section">
            <div className="flex items-center justify-between"><h2 className="form-section-title"><span><FiPackage /></span> Order Items</h2><StatusBadge>{order.orderStatus}</StatusBadge></div>
            <div className="mt-5 divide-y divide-gold/10">{order.items.map((item) => <div key={item.id || item._id} className="flex gap-4 py-4"><img src={item.image || item.product?.image?.url} alt="" className="h-20 w-20 rounded-xl object-cover" /><div className="min-w-0 flex-1"><p className="font-semibold">{item.name}</p><p className="text-xs text-muted">Size {item.size} · Qty {item.quantity}</p>{Object.entries(item.customization || {}).filter(([, value]) => value).map(([key, value]) => <p key={key} className="mt-1 text-xs text-muted"><strong className="capitalize">{key}:</strong> {value}</p>)}</div><strong>{formatCurrency(item.price * item.quantity)}</strong></div>)}</div>
          </section>
          <div className="grid gap-6 md:grid-cols-2">
            <section className="form-section"><h2 className="form-section-title"><span><FiUser /></span> Customer</h2><p className="mt-4 text-sm leading-6">{order.user?.firstName} {order.user?.lastName}<br /><span className="text-muted">{order.user?.email}<br />{order.user?.phone}</span></p></section>
            <section className="form-section"><h2 className="form-section-title"><span><FiMapPin /></span> Shipping</h2><p className="mt-4 text-sm leading-6">{address.fullName}<br /><span className="text-muted">{address.addressLine1}{address.addressLine2 && `, ${address.addressLine2}`}<br />{address.city}, {address.district}<br />{address.province}, {address.country}<br />{address.phone}</span></p></section>
          </div>
          <section className="form-section"><h2 className="form-section-title"><span><FiTruck /></span> Fulfilment Timeline</h2><div className="mt-6"><OrderTimeline timeline={order.timeline} status={order.orderStatus} /></div></section>
        </div>
        <aside className="space-y-6">
          <form onSubmit={handleSubmit(save)} className="form-section"><h2 className="font-serif text-2xl font-semibold">Manage Order</h2><div className="mt-5 space-y-4"><label><span className="form-label">Order status</span><select className="input-field" {...register('orderStatus')}>{statuses.map((status) => <option key={status}>{status}</option>)}</select></label><label><span className="form-label">Payment status</span><select className="input-field" {...register('paymentStatus')}><option>Pending</option><option>Paid</option><option>Failed</option><option>Refunded</option></select></label><label><span className="form-label">Tracking number</span><input className="input-field" {...register('trackingNumber')} /></label><label><span className="form-label">Internal/timeline note</span><textarea className="input-field min-h-24" {...register('notes')} /></label><LoadingButton type="submit" loading={saving} className="primary-button w-full">Save Order</LoadingButton></div></form>
          <section className="form-section"><h2 className="font-serif text-2xl font-semibold">Totals</h2><dl className="mt-5 space-y-3 text-sm"><div className="flex justify-between"><dt>Subtotal</dt><dd>{formatCurrency(order.subtotal)}</dd></div><div className="flex justify-between"><dt>Shipping</dt><dd>{formatCurrency(order.shippingFee)}</dd></div><div className="flex justify-between"><dt>Discount</dt><dd>-{formatCurrency(order.discount)}</dd></div><div className="flex justify-between border-t border-gold/15 pt-3 font-semibold"><dt>Total</dt><dd className="font-serif text-xl text-rosewood">{formatCurrency(order.total)}</dd></div></dl></section>
        </aside>
      </div>
    </div>
  )
}

export default AdminOrderDetailsPage
