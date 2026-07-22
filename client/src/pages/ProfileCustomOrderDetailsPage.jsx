import { useCallback, useEffect, useMemo, useState } from 'react'
import { FiArrowLeft, FiCalendar, FiCreditCard, FiExternalLink, FiMapPin, FiPackage, FiUpload, FiXCircle } from 'react-icons/fi'
import toast from 'react-hot-toast'
import { useSelector } from 'react-redux'
import { Link, useParams } from 'react-router-dom'
import StatusBadge from '../components/admin/StatusBadge.jsx'
import ConfirmModal from '../components/common/ConfirmModal.jsx'
import LoadingButton from '../components/common/LoadingButton.jsx'
import LoadingSkeleton from '../components/common/LoadingSkeleton.jsx'
import CustomOrderTimeline from '../components/order/CustomOrderTimeline.jsx'
import { customOrderApi } from '../services/customOrderApi.js'
import { formatCurrency } from '../utils/formatCurrency.js'

const paymentLabels = { COD: 'Cash on Delivery', 'Bank Transfer': 'Bank Transfer' }

function ProfileCustomOrderDetailsPage() {
  const { id } = useParams()
  const user = useSelector((state) => state.auth.user)
  const [customOrder, setCustomOrder] = useState(null)
  const [paymentConfig, setPaymentConfig] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const [cancelOpen, setCancelOpen] = useState(false)
  const [error, setError] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('COD')
  const [addressId, setAddressId] = useState(user?.addresses?.find((address) => address.isDefault)?.id || user?.addresses?.[0]?.id || '')
  const [paymentReference, setPaymentReference] = useState('')
  const [paymentSlip, setPaymentSlip] = useState(null)

  const load = useCallback(async ({ quiet = false } = {}) => {
    if (!quiet) setLoading(true)
    try {
      const [order, config] = await Promise.all([customOrderApi.get(id), customOrderApi.paymentConfig()])
      setCustomOrder(order)
      setPaymentConfig(config)
      setError('')
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to load this custom order.')
    } finally {
      if (!quiet) setLoading(false)
    }
  }, [id])

  useEffect(() => { void load(); const timer = setInterval(() => void load({ quiet: true }), 15000); return () => clearInterval(timer) }, [load])

  const slipPreview = useMemo(() => paymentSlip ? URL.createObjectURL(paymentSlip) : '', [paymentSlip])
  useEffect(() => () => { if (slipPreview) URL.revokeObjectURL(slipPreview) }, [slipPreview])

  const submitPayment = async (event) => {
    event.preventDefault()
    if (!addressId) { toast.error('Select or add a delivery address.'); return }
    if (paymentMethod === 'Bank Transfer' && !paymentSlip) { toast.error('Upload your bank payment slip.'); return }
    setSubmitting(true)
    try {
      const formData = new FormData()
      formData.set('paymentMethod', paymentMethod)
      formData.set('addressId', addressId)
      formData.set('paymentReference', paymentReference)
      if (paymentSlip) formData.set('paymentSlip', paymentSlip)
      setCustomOrder(await customOrderApi.submitPayment(id, formData))
      setPaymentSlip(null)
      toast.success(paymentMethod === 'COD' ? 'Cash on Delivery selected.' : 'Payment slip submitted for verification.')
    } catch (requestError) {
      toast.error(requestError.response?.data?.message || 'Unable to submit payment details.')
    } finally { setSubmitting(false) }
  }

  const cancel = async () => {
    setCancelling(true)
    try { setCustomOrder(await customOrderApi.cancel(id)); setCancelOpen(false); toast.success('Custom order cancelled.') }
    catch (requestError) { toast.error(requestError.response?.data?.message || 'Unable to cancel this custom order.') }
    finally { setCancelling(false) }
  }

  if (loading) return <LoadingSkeleton />
  if (error || !customOrder) return <p className="rounded-xl bg-red-50 p-5 text-sm text-red-700">{error}</p>

  const paymentOpen = customOrder.status === 'Quoted' && Number(customOrder.quotedPrice) > 0 && ['Not Selected', 'Payment Rejected'].includes(customOrder.paymentStatus)
  const canCancel = ['Pending', 'Reviewing', 'Quoted'].includes(customOrder.status) && customOrder.paymentStatus !== 'Paid'
  const address = customOrder.deliveryAddress
  const hasDeliveryAddress = Boolean(address?.addressLine1)
  const bank = paymentConfig?.bankTransfer
  const rejectionNote = [...(customOrder.paymentHistory || [])].reverse().find((entry) => entry.status === 'Payment Rejected')?.note

  return <div className="space-y-6">
    <div className="flex flex-wrap items-end justify-between gap-4"><div><Link to="/profile/custom-orders" className="inline-flex items-center gap-2 text-xs font-semibold text-rosewood"><FiArrowLeft /> My Custom Orders</Link><h2 className="mt-3 break-words font-serif text-3xl font-semibold">{customOrder.requestNumber}</h2><p className="mt-1 text-sm text-muted">Submitted {new Date(customOrder.createdAt).toLocaleString()}</p></div>{canCancel && <button type="button" className="secondary-button text-red-600" onClick={() => setCancelOpen(true)}><FiXCircle /> Cancel Request</button>}</div>

    <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
      <div className="space-y-6">
        <section className="form-section"><div className="flex flex-wrap items-center justify-between gap-3"><h3 className="form-section-title"><span><FiPackage /></span> Custom Order</h3><StatusBadge>{customOrder.status}</StatusBadge></div><dl className="mt-6 grid gap-4 text-sm sm:grid-cols-2"><div><dt className="text-xs text-muted">Gift</dt><dd className="mt-1 font-medium">{customOrder.bouquetType || customOrder.giftType}</dd></div><div><dt className="text-xs text-muted">Occasion</dt><dd className="mt-1 font-medium">{customOrder.occasion}</dd></div><div><dt className="text-xs text-muted">Required date</dt><dd className="mt-1 flex items-center gap-2 font-medium"><FiCalendar className="text-rosewood" />{new Date(customOrder.requiredDate).toLocaleDateString()}</dd></div><div><dt className="text-xs text-muted">Preferred colors</dt><dd className="mt-1 font-medium">{customOrder.preferredColors}</dd></div></dl><p className="mt-5 border-t border-gold/10 pt-5 whitespace-pre-wrap text-sm leading-7 text-muted">{customOrder.description}</p>{customOrder.adminNote && <div className="mt-5 rounded-xl bg-pink-light/45 p-4 text-sm"><strong>Update from Eshaz:</strong> <span className="text-muted">{customOrder.adminNote}</span></div>}</section>
        <section className="form-section"><h3 className="font-serif text-2xl font-semibold">Fulfilment Timeline</h3><div className="mt-6"><CustomOrderTimeline timeline={customOrder.statusHistory} status={customOrder.status} /></div>{customOrder.trackingNumber && <p className="mt-5 rounded-xl bg-pink-light/50 p-4 text-sm"><strong>Tracking number:</strong> {customOrder.trackingNumber}</p>}{customOrder.estimatedDelivery && <p className="mt-3 text-sm text-muted"><strong className="text-ink">Estimated delivery:</strong> {new Date(customOrder.estimatedDelivery).toLocaleDateString()}</p>}</section>
        {hasDeliveryAddress && <section className="form-section"><h3 className="form-section-title"><span><FiMapPin /></span> Delivery Address</h3><p className="mt-4 text-sm leading-7 text-muted"><strong className="text-ink">{address.fullName}</strong><br />{address.addressLine1}{address.addressLine2 && `, ${address.addressLine2}`}<br />{address.city}, {address.district}, {address.province}<br />{address.country} · {address.phone}</p></section>}
      </div>

      <aside className="space-y-6">
        <section className="form-section"><h3 className="font-serif text-2xl font-semibold">Quote & Payment</h3><div className="mt-5 flex items-center justify-between border-b border-gold/10 pb-4"><span className="text-sm text-muted">Quoted total</span><strong className="font-serif text-2xl text-rosewood">{customOrder.quotedPrice ? formatCurrency(customOrder.quotedPrice) : 'Awaiting quote'}</strong></div><dl className="mt-4 space-y-3 text-sm"><div className="flex justify-between gap-4"><dt className="text-muted">Method</dt><dd className="text-right font-semibold">{paymentLabels[customOrder.paymentMethod] || 'Not selected'}</dd></div><div className="flex justify-between gap-4"><dt className="text-muted">Payment status</dt><dd><StatusBadge>{customOrder.paymentStatus}</StatusBadge></dd></div>{customOrder.paymentReference && <div className="flex justify-between gap-4"><dt className="text-muted">Transfer reference</dt><dd className="break-all text-right font-semibold">{customOrder.paymentReference}</dd></div>}</dl>{customOrder.paymentSlip?.url && <a href={customOrder.paymentSlip.url} target="_blank" rel="noreferrer" className="mt-5 block"><img src={customOrder.paymentSlip.url} alt="Uploaded payment slip" className="max-h-72 w-full rounded-xl bg-cream object-contain" /><span className="mt-2 flex items-center justify-center gap-2 text-xs font-semibold text-rosewood"><FiExternalLink /> Open uploaded slip</span></a>}{customOrder.paymentStatus === 'Payment Rejected' && <p className="mt-4 rounded-xl bg-red-50 p-3 text-xs text-red-700"><strong>Payment slip rejected.</strong>{rejectionNote ? ` ${rejectionNote}` : ' Upload a clear replacement slip.'}</p>}</section>

        {paymentOpen && <form onSubmit={submitPayment} className="form-section"><h3 className="form-section-title"><span><FiCreditCard /></span> Accept Quote</h3><p className="mt-2 text-sm leading-6 text-muted">Choose how you will pay and confirm the delivery address.</p><div className="mt-5 grid gap-3">{paymentConfig?.methods?.map((method) => <label key={method} className={`flex cursor-pointer items-center gap-3 rounded-xl border p-4 ${paymentMethod === method ? 'border-rosewood bg-pink-light/35' : 'border-gold/15'}`}><input type="radio" name="paymentMethod" value={method} checked={paymentMethod === method} onChange={() => setPaymentMethod(method)} className="accent-rosewood" /><span className="text-sm font-semibold">{paymentLabels[method]}</span></label>)}</div>
          <label className="mt-5 block"><span className="form-label">Delivery address</span><select className="input-field" value={addressId} onChange={(event) => setAddressId(event.target.value)}><option value="">Select saved address</option>{user?.addresses?.map((saved) => <option key={saved.id || saved._id} value={saved.id || saved._id}>{saved.label} — {saved.addressLine1}, {saved.city}</option>)}</select></label>{!user?.addresses?.length && <Link to="/profile/addresses" className="mt-2 inline-flex text-xs font-semibold text-rosewood">Add a delivery address first</Link>}
          {paymentMethod === 'Bank Transfer' && bank?.available && <div className="mt-5 space-y-4"><div className="rounded-2xl border border-gold/20 bg-cream p-4"><p className="text-xs font-semibold uppercase tracking-wider text-gold">Owner’s Bank Account</p><dl className="mt-3 space-y-2 text-sm"><div><dt className="text-xs text-muted">Bank</dt><dd className="font-semibold">{bank.bankName}</dd></div><div><dt className="text-xs text-muted">Account name</dt><dd className="font-semibold">{bank.accountName}</dd></div><div><dt className="text-xs text-muted">Account number</dt><dd className="break-all font-semibold">{bank.accountNumber}</dd></div><div><dt className="text-xs text-muted">Branch</dt><dd className="font-semibold">{bank.branch}{bank.branchCode ? ` (${bank.branchCode})` : ''}</dd></div></dl>{bank.instructions && <p className="mt-3 text-xs leading-5 text-muted">{bank.instructions}</p>}</div><label><span className="form-label">Transfer reference <span className="font-normal text-muted">(optional)</span></span><input className="input-field" maxLength="120" value={paymentReference} onChange={(event) => setPaymentReference(event.target.value)} /></label><label><span className="form-label">Payment slip</span><input type="file" accept="image/*,.heic,.heif" className="input-field file:mr-3 file:rounded-full file:border-0 file:bg-pink-light file:px-3 file:py-2 file:text-xs file:font-semibold file:text-rosewood" onChange={(event) => setPaymentSlip(event.target.files?.[0] || null)} /></label>{slipPreview && <img src={slipPreview} alt="Payment slip preview" className="max-h-64 w-full rounded-xl bg-cream object-contain" />}</div>}
          <LoadingButton type="submit" loading={submitting} className="primary-button mt-5 w-full"><FiUpload /> {paymentMethod === 'COD' ? 'Confirm Cash on Delivery' : 'Submit Payment Slip'}</LoadingButton></form>}
      </aside>
    </div>
    <ConfirmModal open={cancelOpen} title="Cancel this custom order?" message="You can cancel before payment approval and fulfilment begins." confirmLabel="Cancel Custom Order" onClose={() => setCancelOpen(false)} onConfirm={cancel} loading={cancelling} />
  </div>
}

export default ProfileCustomOrderDetailsPage
