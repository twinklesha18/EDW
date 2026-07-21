import { useEffect, useState } from 'react'
import { FiCheckCircle, FiPackage } from 'react-icons/fi'
import { Link, useLocation, useSearchParams } from 'react-router-dom'
import LoadingSkeleton from '../components/common/LoadingSkeleton.jsx'
import PageTransition from '../components/common/PageTransition.jsx'
import { checkoutApi } from '../services/checkoutApi.js'
import { formatCurrency } from '../utils/formatCurrency.js'

function OrderSuccessPage() {
  const location = useLocation(), [params] = useSearchParams(), [order, setOrder] = useState(location.state?.order || null), [error, setError] = useState(''), [loading, setLoading] = useState(!location.state?.order && Boolean(params.get('payment_intent')))
  useEffect(() => { const intent = params.get('payment_intent'); if (!order && intent) checkoutApi.verifyStripe(intent).then(setOrder).catch((requestError) => setError(requestError.response?.data?.message || 'Payment completed, but the order could not be verified. Please contact support.')).finally(() => setLoading(false)) }, [order, params])
  if (loading) return <LoadingSkeleton />
  return <PageTransition><section className="section-shell py-16"><div className="mx-auto max-w-2xl rounded-[2rem] border border-gold/20 bg-white p-8 text-center shadow-luxury sm:p-12"><span className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-[#edf8f1] text-4xl text-[#39704f]"><FiCheckCircle /></span><p className="mt-6 text-xs font-semibold uppercase tracking-[.22em] text-gold">Order Complete</p><h1 className="mt-2 font-serif text-4xl font-semibold">Thank You for Your Order</h1>{error ? <p className="mt-5 rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</p> : order ? <><p className="mt-4 text-sm leading-6 text-muted">Your order <strong className="text-ink">{order.orderNumber}</strong> has been received. We’ll keep you updated as it moves through preparation and delivery.</p><div className="mx-auto mt-7 grid max-w-md grid-cols-2 gap-3 rounded-2xl bg-pink-light/40 p-5 text-left text-sm"><div><p className="text-xs text-muted">Payment</p><p className="mt-1 font-semibold">{order.paymentMethod === 'COD' ? 'Cash on Delivery' : order.paymentStatus}</p></div><div><p className="text-xs text-muted">Total</p><p className="mt-1 font-semibold text-rosewood">{formatCurrency(order.total)}</p></div></div><div className="mt-8 flex flex-wrap justify-center gap-3"><Link to={`/orders/${order.orderNumber}`} className="primary-button"><FiPackage /> View Order</Link><Link to="/shop" className="secondary-button">Continue Shopping</Link></div></> : <><p className="mt-4 text-sm text-muted">There is no new order to display.</p><Link to="/profile/orders" className="primary-button mt-7">View My Orders</Link></>}</div></section></PageTransition>
}
export default OrderSuccessPage
