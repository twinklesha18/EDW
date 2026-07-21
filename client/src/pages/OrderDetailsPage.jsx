import { useCallback, useEffect, useState } from 'react'
import { FiArrowLeft, FiDownload, FiMapPin, FiRefreshCw, FiTruck, FiXCircle } from 'react-icons/fi'
import toast from 'react-hot-toast'
import { useDispatch } from 'react-redux'
import { Link, useNavigate, useParams } from 'react-router-dom'
import StatusBadge from '../components/admin/StatusBadge.jsx'
import CheckoutSummary from '../components/checkout/CheckoutSummary.jsx'
import ConfirmModal from '../components/common/ConfirmModal.jsx'
import LoadingSkeleton from '../components/common/LoadingSkeleton.jsx'
import OrderTimeline from '../components/order/OrderTimeline.jsx'
import { fetchCart } from '../redux/slices/cartSlice.js'
import { checkoutApi, downloadBlob } from '../services/checkoutApi.js'
import { formatCurrency } from '../utils/formatCurrency.js'

function OrderDetailsPage() {
  const { orderNumber } = useParams()
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [cancelling, setCancelling] = useState(false)
  const [cancelOpen, setCancelOpen] = useState(false)

  const load = useCallback(async ({ quiet = false } = {}) => {
    if (!quiet) setLoading(true)
    try { setOrder(await checkoutApi.getOrder(orderNumber)); setError('') }
    catch (requestError) { setError(requestError.response?.data?.message || 'Unable to load order.') }
    finally { if (!quiet) setLoading(false) }
  }, [orderNumber])

  useEffect(() => { void load(); const timer = setInterval(() => void load({ quiet: true }), 15000); return () => clearInterval(timer) }, [load])

  const invoice = async () => { try { downloadBlob(await checkoutApi.invoice(orderNumber), `${orderNumber}-invoice.pdf`) } catch { toast.error('Unable to download invoice.') } }
  const cancel = async () => { setCancelling(true); try { setOrder(await checkoutApi.cancelOrder(orderNumber)); setCancelOpen(false); toast.success('Order cancelled successfully.') } catch (requestError) { toast.error(requestError.response?.data?.message || 'Unable to cancel order.') } finally { setCancelling(false) } }
  const reorder = async () => { try { await checkoutApi.reorder(orderNumber); await dispatch(fetchCart()); toast.success('Products added to your cart.'); navigate('/cart') } catch (requestError) { toast.error(requestError.response?.data?.message || 'Unable to reorder.') } }

  if (loading) return <LoadingSkeleton />
  if (error || !order) return <section className="section-shell py-16"><p className="rounded-2xl bg-red-50 p-5 text-red-700">{error}</p></section>

  const quote = { subtotal: order.subtotal, shippingFee: order.shippingFee, discount: order.discount, total: order.total, coupon: order.coupon, shippingLabel: `${order.shippingMethod?.[0]?.toUpperCase()}${order.shippingMethod?.slice(1)} Delivery`, estimatedDelivery: order.estimatedDelivery }
  const address = order.shippingAddress

  return (
    <section className="bg-pink-light/20 py-10">
      <div className="section-shell">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div><Link to="/profile/orders" className="inline-flex items-center gap-2 text-xs font-semibold text-rosewood"><FiArrowLeft /> My Orders</Link><h1 className="mt-3 font-serif text-4xl font-semibold">{order.orderNumber}</h1><p className="mt-1 text-sm text-muted">Placed {new Date(order.createdAt).toLocaleString()}</p></div>
          <div className="flex flex-wrap gap-2"><button type="button" className="secondary-button" onClick={invoice}><FiDownload /> Invoice</button><button type="button" className="secondary-button" onClick={reorder}><FiRefreshCw /> Reorder</button>{order.orderStatus === 'Pending' && <button type="button" className="secondary-button text-red-600" onClick={() => setCancelOpen(true)}><FiXCircle /> Cancel</button>}</div>
        </div>
        <div className="mt-8 grid items-start gap-7 xl:grid-cols-[minmax(0,1fr)_370px]">
          <div className="space-y-6">
            <section className="form-section">
              <div className="flex items-center justify-between"><h2 className="font-serif text-2xl font-semibold">Order Items</h2><StatusBadge>{order.orderStatus}</StatusBadge></div>
              <div className="mt-5 divide-y divide-gold/10">{order.items.map((item) => <div key={item.id || item._id} className="flex gap-4 py-4"><img src={item.image || item.product?.image?.url} alt="" className="h-20 w-20 rounded-xl object-cover" /><div className="min-w-0 flex-1"><Link to={item.slug ? `/product/${item.slug}` : '#'} className="font-semibold hover:text-rosewood">{item.name}</Link><p className="text-xs text-muted">Size {item.size} · Qty {item.quantity}</p>{Object.entries(item.customization || {}).filter(([, value]) => value).map(([key, value]) => <p key={key} className="mt-1 text-xs text-muted"><strong className="capitalize">{key}:</strong> {value}</p>)}</div><strong>{formatCurrency(item.price * item.quantity)}</strong></div>)}</div>
            </section>
            <section className="form-section"><h2 className="form-section-title"><span><FiTruck /></span> Fulfilment Timeline</h2><div className="mt-6"><OrderTimeline timeline={order.timeline} status={order.orderStatus} /></div>{order.trackingNumber && <p className="mt-5 rounded-xl bg-pink-light/50 p-4 text-sm"><strong>Tracking number:</strong> {order.trackingNumber}</p>}</section>
            <section className="form-section"><h2 className="form-section-title"><span><FiMapPin /></span> Delivery Address</h2><p className="mt-4 text-sm leading-7 text-muted"><strong className="text-ink">{address.fullName}</strong><br />{address.addressLine1}{address.addressLine2 && `, ${address.addressLine2}`}<br />{address.city}, {address.district}, {address.province}<br />Sri Lanka · {address.phone}</p></section>
          </div>
          <div className="space-y-6"><CheckoutSummary quote={quote} /><section className="form-section"><h2 className="font-serif text-2xl font-semibold">Payment</h2><dl className="mt-4 space-y-3 text-sm"><div className="flex justify-between"><dt className="text-muted">Method</dt><dd className="font-semibold">{order.paymentMethod === 'COD' ? 'Cash on Delivery' : 'Stripe Card'}</dd></div><div className="flex justify-between"><dt className="text-muted">Status</dt><dd><StatusBadge>{order.paymentStatus}</StatusBadge></dd></div></dl></section></div>
        </div>
      </div>
      <ConfirmModal open={cancelOpen} title="Cancel this order?" message="Paid card orders create a pending refund request for administrator review." confirmLabel="Cancel Order" onClose={() => setCancelOpen(false)} onConfirm={cancel} loading={cancelling} />
    </section>
  )
}

export default OrderDetailsPage
