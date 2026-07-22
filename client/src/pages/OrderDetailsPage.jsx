import { useCallback, useEffect, useState } from 'react'
import { FiArrowLeft, FiDownload, FiExternalLink, FiMapPin, FiMessageSquare, FiRefreshCw, FiStar, FiTruck, FiUpload, FiXCircle } from 'react-icons/fi'
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
  const [cancellationReason, setCancellationReason] = useState('')
  const [replacementSlip, setReplacementSlip] = useState(null)
  const [paymentReference, setPaymentReference] = useState('')
  const [submittingSlip, setSubmittingSlip] = useState(false)
  const [reviewing, setReviewing] = useState(null)
  const [reviewRating, setReviewRating] = useState(5)
  const [reviewTitle, setReviewTitle] = useState('')
  const [reviewComment, setReviewComment] = useState('')
  const [reviewSaving, setReviewSaving] = useState(false)

  const load = useCallback(async ({ quiet = false } = {}) => {
    if (!quiet) setLoading(true)
    try { setOrder(await checkoutApi.getOrder(orderNumber)); setError('') }
    catch (requestError) { setError(requestError.response?.data?.message || 'Unable to load order.') }
    finally { if (!quiet) setLoading(false) }
  }, [orderNumber])

  useEffect(() => { void load(); const timer = setInterval(() => void load({ quiet: true }), 15000); return () => clearInterval(timer) }, [load])

  const invoice = async () => { try { downloadBlob(await checkoutApi.invoice(orderNumber), `${orderNumber}-invoice.pdf`) } catch { toast.error('Unable to download invoice.') } }
  const cancel = async () => {
    if (cancellationReason.trim().length < 10) return toast.error('Please enter a cancellation reason of at least 10 characters.')
    setCancelling(true)
    try { setOrder(await checkoutApi.cancelOrder(orderNumber, cancellationReason)); setCancelOpen(false); setCancellationReason(''); toast.success('Order cancelled successfully.') }
    catch (requestError) { toast.error(requestError.response?.data?.message || 'Unable to cancel order.') }
    finally { setCancelling(false) }
  }
  const reorder = async () => { try { await checkoutApi.reorder(orderNumber); await dispatch(fetchCart()); toast.success('Products added to your cart.'); navigate('/cart') } catch (requestError) { toast.error(requestError.response?.data?.message || 'Unable to reorder.') } }
  const resubmitSlip = async () => {
    if (!replacementSlip) return toast.error('Choose a replacement payment slip first.')
    if (replacementSlip.size > 12 * 1024 * 1024) return toast.error('Payment slip must be smaller than 12 MB.')
    setSubmittingSlip(true)
    try {
      setOrder(await checkoutApi.resubmitPaymentSlip(orderNumber, replacementSlip, paymentReference))
      setReplacementSlip(null); setPaymentReference('')
      toast.success('Replacement payment slip submitted for verification.')
    } catch (requestError) { toast.error(requestError.response?.data?.message || 'Unable to submit the payment slip.') }
    finally { setSubmittingSlip(false) }
  }
  const openReview = (item) => {
    setReviewing(item)
    setReviewRating(5)
    setReviewTitle('')
    setReviewComment('')
  }
  const closeReview = () => { setReviewing(null); setReviewTitle(''); setReviewComment(''); setReviewRating(5) }
  const submitReview = async (event) => {
    event.preventDefault()
    const productId = reviewing?.product?.id || reviewing?.product?._id
    if (!productId) return toast.error('This product is no longer available for review.')
    if (reviewComment.trim().length < 5) return toast.error('Please write at least 5 characters.')
    setReviewSaving(true)
    try {
      await checkoutApi.createReview({ orderNumber, productId, rating: reviewRating, title: reviewTitle, comment: reviewComment })
      toast.success('Review submitted for administrator approval.')
      closeReview()
      await load({ quiet: true })
    } catch (requestError) {
      const detail = requestError.response?.data?.errors?.[0]?.message
      toast.error(detail || requestError.response?.data?.message || 'Unable to submit your review.')
    } finally { setReviewSaving(false) }
  }

  if (loading) return <LoadingSkeleton />
  if (error || !order) return <section className="section-shell py-16"><p className="rounded-2xl bg-red-50 p-5 text-red-700">{error}</p></section>

  const quote = { subtotal: order.subtotal, shippingFee: order.shippingFee, total: order.total, shippingLabel: `${order.shippingMethod?.[0]?.toUpperCase()}${order.shippingMethod?.slice(1)} Delivery`, estimatedDelivery: order.estimatedDelivery }
  const address = order.shippingAddress
  const reviewableItems = [...new Map(order.items.map((item) => [String(item.product?.id || item.product?._id || item.product), item])).values()]
  const customerReviewFor = (item) => order.customerReviews?.find((review) => String(review.product?.id || review.product?._id || review.product) === String(item.product?.id || item.product?._id || item.product))

  return (
    <section className="bg-pink-light/20 py-10">
      <div className="section-shell">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div><Link to="/profile/orders" className="inline-flex items-center gap-2 text-xs font-semibold text-rosewood"><FiArrowLeft /> My Orders</Link><h1 className="mt-3 font-serif text-4xl font-semibold">{order.orderNumber}</h1><p className="mt-1 text-sm text-muted">Placed {new Date(order.createdAt).toLocaleString()}</p></div>
          <div className="flex flex-wrap gap-2">{order.orderStatus === 'Delivered' && <button type="button" className="secondary-button" onClick={invoice}><FiDownload /> Invoice</button>}{['Delivered', 'Cancelled'].includes(order.orderStatus) && <button type="button" className="secondary-button" onClick={reorder}><FiRefreshCw /> Reorder</button>}{order.orderStatus === 'Pending' && <button type="button" className="secondary-button text-red-600" onClick={() => setCancelOpen(true)}><FiXCircle /> Cancel</button>}</div>
          {!['Delivered', 'Cancelled'].includes(order.orderStatus) && <p className="mt-3 text-xs text-muted">Your invoice will be available here after the order is delivered.</p>}
        </div>
        <div className="mt-8 grid items-start gap-7 xl:grid-cols-[minmax(0,1fr)_370px]">
          <div className="space-y-6">
            <section className="form-section">
              <div className="flex items-center justify-between"><h2 className="font-serif text-2xl font-semibold">Order Items</h2><StatusBadge>{order.orderStatus}</StatusBadge></div>
              <div className="mt-5 divide-y divide-gold/10">{order.items.map((item) => <div key={item.id || item._id} className="flex gap-4 py-4"><img src={item.image || item.product?.image?.url} alt="" className="h-20 w-20 rounded-xl object-cover" /><div className="min-w-0 flex-1"><Link to={item.slug ? `/product/${item.slug}` : '#'} className="font-semibold hover:text-rosewood">{item.name}</Link><p className="text-xs text-muted">Size {item.size} · Qty {item.quantity}</p>{Object.entries(item.customization || {}).filter(([, value]) => value).map(([key, value]) => <p key={key} className="mt-1 text-xs text-muted"><strong className="capitalize">{key}:</strong> {value}</p>)}</div><strong>{formatCurrency(item.price * item.quantity)}</strong></div>)}</div>
            </section>
            {order.orderStatus === 'Delivered' && <section className="form-section">
              <h2 className="form-section-title"><span><FiMessageSquare /></span> Review Your Order</h2>
              <p className="mt-2 text-sm text-muted">Share feedback for the products you received. Reviews appear publicly only after administrator approval.</p>
              <div className="mt-5 space-y-4">{reviewableItems.map((item) => {
                const productId = String(item.product?.id || item.product?._id || item.product)
                const existingReview = customerReviewFor(item)
                const isEditing = String(reviewing?.product?.id || reviewing?.product?._id || '') === productId
                return <article key={productId} className="rounded-2xl border border-gold/15 p-4">
                  <div className="flex flex-wrap items-center gap-4"><img src={item.image || item.product?.image?.url} alt="" className="h-16 w-16 rounded-xl object-cover" /><div className="min-w-0 flex-1"><p className="font-semibold">{item.name}</p>{existingReview && <div className="mt-1 text-gold">{'★'.repeat(existingReview.rating)}</div>}</div>{!existingReview && item.product && <button type="button" className="secondary-button min-h-10" onClick={() => openReview(item)}><FiStar /> Write Review</button>}</div>
                  {existingReview && <div className="mt-4 rounded-xl bg-pink-light/25 p-4">{existingReview.title && <h3 className="font-semibold">{existingReview.title}</h3>}<p className="mt-1 text-sm leading-6 text-muted">{existingReview.comment}</p></div>}
                  {isEditing && <form onSubmit={submitReview} className="mt-5 space-y-4 border-t border-gold/10 pt-5"><div><span className="form-label">Your rating</span><div className="mt-1 flex gap-1">{[1, 2, 3, 4, 5].map((value) => <button key={value} type="button" className={`p-1 text-2xl ${value <= reviewRating ? 'text-gold' : 'text-muted/25'}`} onClick={() => setReviewRating(value)} aria-label={`${value} stars`}><FiStar className={value <= reviewRating ? 'fill-current' : ''} /></button>)}</div></div><label className="block"><span className="form-label">Review title (optional)</span><input className="input-field" maxLength="120" value={reviewTitle} onChange={(event) => setReviewTitle(event.target.value)} /></label><label className="block"><span className="form-label">Your review</span><textarea className="input-field min-h-28" required minLength="5" maxLength="1500" value={reviewComment} onChange={(event) => setReviewComment(event.target.value)} placeholder="Tell us about the product you received…" /></label><div className="flex flex-wrap gap-3"><button type="submit" disabled={reviewSaving} className="primary-button">{reviewSaving ? 'Submitting…' : 'Submit for Approval'}</button><button type="button" disabled={reviewSaving} className="secondary-button" onClick={closeReview}>Cancel</button></div></form>}
                </article>
              })}</div>
            </section>}
            <section className="form-section"><h2 className="form-section-title"><span><FiTruck /></span> Fulfilment Timeline</h2><div className="mt-6"><OrderTimeline timeline={order.timeline} status={order.orderStatus} /></div>{order.cancellation?.reason && <div className="mt-5 rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-700"><strong>Cancellation reason</strong><p className="mt-1 whitespace-pre-wrap">{order.cancellation.reason}</p></div>}{order.trackingNumber && <p className="mt-5 rounded-xl bg-pink-light/50 p-4 text-sm"><strong>Tracking number:</strong> {order.trackingNumber}</p>}</section>
            <section className="form-section"><h2 className="form-section-title"><span><FiMapPin /></span> Delivery Address</h2><p className="mt-4 text-sm leading-7 text-muted"><strong className="text-ink">{address.fullName}</strong><br />{address.addressLine1}{address.addressLine2 && `, ${address.addressLine2}`}<br />{address.city}, {address.district}, {address.province}<br />Sri Lanka · {address.phone}</p></section>
          </div>
          <div className="space-y-6"><CheckoutSummary quote={quote} /><section className="form-section"><h2 className="font-serif text-2xl font-semibold">Payment</h2><dl className="mt-4 space-y-3 text-sm"><div className="flex justify-between gap-3"><dt className="text-muted">Method</dt><dd className="text-right font-semibold">{order.paymentMethod === 'COD' ? 'Cash on Delivery' : order.paymentMethod}</dd></div><div className="flex justify-between gap-3"><dt className="text-muted">Status</dt><dd><StatusBadge>{order.paymentStatus}</StatusBadge></dd></div>{order.payment?.reference && <div className="flex justify-between gap-3"><dt className="text-muted">Reference</dt><dd className="break-all text-right font-semibold">{order.payment.reference}</dd></div>}</dl>{order.payment?.slip?.url && <a href={order.payment.slip.url} target="_blank" rel="noreferrer" className="secondary-button mt-5 w-full"><FiExternalLink /> View Uploaded Slip</a>}{order.payment?.reviewNote && <p className={`mt-4 rounded-xl p-3 text-sm ${order.paymentStatus === 'Payment Rejected' ? 'bg-red-50 text-red-700' : 'bg-cream text-muted'}`}><strong>Payment review:</strong> {order.payment.reviewNote}</p>}{order.paymentMethod === 'Bank Transfer' && order.paymentStatus === 'Payment Rejected' && order.orderStatus === 'Pending' && <div className="mt-5 space-y-4 border-t border-gold/15 pt-5"><p className="text-sm text-muted">Upload a corrected slip after checking the administrator’s reason above.</p><label className="block"><span className="form-label">Payment reference (optional)</span><input className="input-field" maxLength="120" value={paymentReference} onChange={(event) => setPaymentReference(event.target.value)} /></label><label className="block"><span className="form-label">Replacement payment slip</span><span className="mt-2 flex cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gold/30 p-4 text-sm font-semibold"><FiUpload /> {replacementSlip?.name || 'Choose photo or image'}<input type="file" className="sr-only" accept="image/*,.heic,.heif" onChange={(event) => setReplacementSlip(event.target.files?.[0] || null)} /></span></label><button type="button" disabled={submittingSlip} className="primary-button w-full" onClick={resubmitSlip}>{submittingSlip ? 'Uploading…' : 'Resubmit Payment Slip'}</button></div>}</section></div>
        </div>
      </div>
      <ConfirmModal open={cancelOpen} title="Cancel this order?" message="Tell us why you need to cancel. This reason will be shared with the administrator." confirmLabel="Cancel Order" onClose={() => { setCancelOpen(false); setCancellationReason('') }} onConfirm={cancel} loading={cancelling}><label className="block"><span className="form-label">Reason for cancellation</span><textarea className="input-field min-h-28" value={cancellationReason} onChange={(event) => setCancellationReason(event.target.value)} minLength="10" maxLength="500" placeholder="Please explain why you are cancelling this order…" autoFocus /><span className="mt-1 block text-right text-xs text-muted">{cancellationReason.trim().length}/500</span></label></ConfirmModal>
    </section>
  )
}

export default OrderDetailsPage
