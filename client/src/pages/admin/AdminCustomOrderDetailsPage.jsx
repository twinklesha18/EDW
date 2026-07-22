import { useEffect, useState } from 'react'
import { FiArrowLeft, FiCalendar, FiCheckCircle, FiCreditCard, FiExternalLink, FiGift, FiMail, FiMapPin, FiMessageSquare, FiPhone, FiUser, FiXCircle } from 'react-icons/fi'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { Link, useParams } from 'react-router-dom'
import AdminPageHeader from '../../components/admin/AdminPageHeader.jsx'
import StatusBadge from '../../components/admin/StatusBadge.jsx'
import LoadingButton from '../../components/common/LoadingButton.jsx'
import LoadingSkeleton from '../../components/common/LoadingSkeleton.jsx'
import { adminApi } from '../../services/adminApi.js'
import { formatCurrency } from '../../utils/formatCurrency.js'

const statuses = ['Pending', 'Reviewing', 'Quoted', 'Approved', 'In Progress', 'Completed', 'Rejected', 'Cancelled']

function AdminCustomOrderDetailsPage() {
  const { id } = useParams()
  const [customOrder, setCustomOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [paymentSaving, setPaymentSaving] = useState(false)
  const [paymentNote, setPaymentNote] = useState('')
  const [error, setError] = useState('')
  const { register, reset, handleSubmit } = useForm()

  useEffect(() => {
    adminApi.get('custom-orders', id)
      .then(({ customOrder: value }) => {
        setCustomOrder(value)
        reset({ status: value.status, quotedPrice: value.quotedPrice ?? '', adminNote: value.adminNote || '', trackingNumber: value.trackingNumber || '', estimatedDelivery: value.estimatedDelivery?.slice(0, 10) || '' })
      })
      .catch((requestError) => setError(requestError.response?.data?.message || 'Unable to load custom order.'))
      .finally(() => setLoading(false))
  }, [id, reset])

  const save = async (values) => {
    setSaving(true)
    try {
      const response = await adminApi.update('custom-orders', id, values)
      const updated = response.data.customOrder
      setCustomOrder(updated)
      reset({ status: updated.status, quotedPrice: updated.quotedPrice ?? '', adminNote: updated.adminNote || '', trackingNumber: updated.trackingNumber || '', estimatedDelivery: updated.estimatedDelivery?.slice(0, 10) || '' })
      toast.success('Custom order updated successfully.')
    } catch (requestError) {
      toast.error(requestError.response?.data?.message || 'Unable to update custom order.')
    } finally {
      setSaving(false)
    }
  }

  const reviewPayment = async (action) => {
    if (action === 'reject' && paymentNote.trim().length < 5) { toast.error('Enter a clear rejection reason first.'); return }
    setPaymentSaving(true)
    try {
      const response = await adminApi.update('custom-orders', `${id}/payment`, { action, note: paymentNote })
      setCustomOrder(response.data.customOrder)
      setPaymentNote('')
      toast.success('Payment status updated successfully.')
    } catch (requestError) {
      toast.error(requestError.response?.data?.message || 'Unable to update payment status.')
    } finally { setPaymentSaving(false) }
  }

  if (loading) return <LoadingSkeleton />
  if (error || !customOrder) return <p className="rounded-xl bg-red-50 p-5 text-sm text-red-700">{error}</p>

  const customer = customOrder.user
  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="Custom Order"
        title={customOrder.requestNumber}
        description={`Submitted ${new Date(customOrder.createdAt).toLocaleString()}`}
        action={<Link to="/admin/custom-orders" className="secondary-button"><FiArrowLeft /> Custom Orders</Link>}
      />

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
          <section className="form-section">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="form-section-title"><span><FiGift /></span> Request Details</h2>
              <StatusBadge>{customOrder.status}</StatusBadge>
            </div>
            <dl className="mt-6 grid gap-5 sm:grid-cols-2">
              <div><dt className="text-xs font-semibold text-muted">Occasion</dt><dd className="mt-1 font-medium">{customOrder.occasion}</dd></div>
              <div><dt className="text-xs font-semibold text-muted">Required Date</dt><dd className="mt-1 flex items-center gap-2 font-medium"><FiCalendar className="text-rosewood" /> {new Date(customOrder.requiredDate).toLocaleDateString()}</dd></div>
              <div><dt className="text-xs font-semibold text-muted">Gift Type</dt><dd className="mt-1 font-medium">{customOrder.giftType}</dd></div>
              <div><dt className="text-xs font-semibold text-muted">Bouquet Type</dt><dd className="mt-1 font-medium">{customOrder.bouquetType || 'Not specified'}</dd></div>
              <div><dt className="text-xs font-semibold text-muted">Budget Range</dt><dd className="mt-1 font-medium">{customOrder.budgetRange}</dd></div>
              <div><dt className="text-xs font-semibold text-muted">Preferred Colors</dt><dd className="mt-1 font-medium">{customOrder.preferredColors}</dd></div>
            </dl>
            <div className="mt-6 border-t border-gold/10 pt-5">
              <h3 className="text-xs font-semibold text-muted">Description</h3>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-7">{customOrder.description}</p>
            </div>
            {customOrder.specialMessage && (
              <div className="mt-5 rounded-2xl bg-pink-light/45 p-4">
                <h3 className="flex items-center gap-2 text-xs font-semibold text-muted"><FiMessageSquare /> Special Message</h3>
                <p className="mt-2 text-sm leading-6">{customOrder.specialMessage}</p>
              </div>
            )}
          </section>

          {customOrder.inspiration?.url && (
            <section className="form-section">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="font-serif text-2xl font-semibold">Inspiration Image</h2>
                <a href={customOrder.inspiration.url} target="_blank" rel="noreferrer" className="secondary-button min-h-10"><FiExternalLink /> Open Full Image</a>
              </div>
              <img src={customOrder.inspiration.url} alt={`Inspiration for ${customOrder.requestNumber}`} className="mt-5 max-h-[620px] w-full rounded-2xl bg-cream object-contain" />
            </section>
          )}

          {customOrder.paymentSlip?.url && (
            <section className="form-section">
              <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="font-serif text-2xl font-semibold">Bank Payment Slip</h2><p className="mt-1 text-sm text-muted">Review the uploaded transfer proof before approving payment.</p></div><StatusBadge>{customOrder.paymentStatus}</StatusBadge></div>
              <a href={customOrder.paymentSlip.url} target="_blank" rel="noreferrer"><img src={customOrder.paymentSlip.url} alt={`Payment slip for ${customOrder.requestNumber}`} className="mt-5 max-h-[680px] w-full rounded-2xl bg-cream object-contain" /></a>
              <div className="mt-4 flex flex-wrap gap-3"><a href={customOrder.paymentSlip.url} target="_blank" rel="noreferrer" className="secondary-button"><FiExternalLink /> Open Full Slip</a></div>
            </section>
          )}

          {customOrder.deliveryAddress?.addressLine1 && <section className="form-section"><h2 className="form-section-title"><span><FiMapPin /></span> Delivery Address</h2><p className="mt-4 text-sm leading-7 text-muted"><strong className="text-ink">{customOrder.deliveryAddress.fullName}</strong><br />{customOrder.deliveryAddress.addressLine1}{customOrder.deliveryAddress.addressLine2 && `, ${customOrder.deliveryAddress.addressLine2}`}<br />{customOrder.deliveryAddress.city}, {customOrder.deliveryAddress.district}, {customOrder.deliveryAddress.province}<br />{customOrder.deliveryAddress.country} · {customOrder.deliveryAddress.phone}</p></section>}

          <section className="form-section">
            <h2 className="font-serif text-2xl font-semibold">Status History</h2>
            <ol className="mt-5 space-y-4">
              {customOrder.statusHistory.map((entry) => (
                <li key={entry.id || entry._id} className="flex gap-3 border-b border-gold/10 pb-4 last:border-0 last:pb-0">
                  <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-rosewood" />
                  <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><StatusBadge>{entry.status}</StatusBadge><span className="text-xs text-muted">{new Date(entry.timestamp).toLocaleString()}</span></div>{entry.note && <p className="mt-2 text-sm leading-6 text-muted">{entry.note}</p>}</div>
                </li>
              ))}
            </ol>
          </section>

          {customOrder.paymentHistory?.length > 0 && <section className="form-section"><h2 className="font-serif text-2xl font-semibold">Payment History</h2><ol className="mt-5 space-y-4">{customOrder.paymentHistory.map((entry) => <li key={entry.id || entry._id} className="flex gap-3 border-b border-gold/10 pb-4 last:border-0"><span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-gold" /><div><div className="flex flex-wrap items-center gap-2"><StatusBadge>{entry.status}</StatusBadge><span className="text-xs text-muted">{new Date(entry.timestamp).toLocaleString()}</span></div>{entry.note && <p className="mt-2 text-sm text-muted">{entry.note}</p>}</div></li>)}</ol></section>}
        </div>

        <aside className="space-y-6">
          <section className="form-section">
            <h2 className="form-section-title"><span><FiUser /></span> Customer</h2>
            {customer ? (
              <div className="mt-5 space-y-3 text-sm">
                <p className="font-semibold">{customer.firstName} {customer.lastName}</p>
                <a href={`mailto:${customer.email}`} className="flex min-w-0 items-center gap-2 break-all text-muted hover:text-rosewood"><FiMail className="shrink-0" /> {customer.email}</a>
                <a href={`tel:${customer.phone}`} className="flex items-center gap-2 text-muted hover:text-rosewood"><FiPhone className="shrink-0" /> {customer.phone}</a>
              </div>
            ) : <p className="mt-4 text-sm text-muted">Customer account is unavailable.</p>}
          </section>

          <section className="form-section">
            <h2 className="form-section-title"><span><FiCreditCard /></span> Payment</h2>
            <dl className="mt-5 space-y-3 text-sm"><div className="flex justify-between gap-3"><dt className="text-muted">Method</dt><dd className="text-right font-semibold">{customOrder.paymentMethod || 'Not selected'}</dd></div><div className="flex justify-between gap-3"><dt className="text-muted">Status</dt><dd><StatusBadge>{customOrder.paymentStatus || 'Not Selected'}</StatusBadge></dd></div>{customOrder.paymentReference && <div className="flex justify-between gap-3"><dt className="text-muted">Reference</dt><dd className="break-all text-right font-semibold">{customOrder.paymentReference}</dd></div>}{customOrder.paymentSubmittedAt && <div className="flex justify-between gap-3"><dt className="text-muted">Submitted</dt><dd className="text-right">{new Date(customOrder.paymentSubmittedAt).toLocaleString()}</dd></div>}</dl>
            {['Slip Submitted', 'COD Pending'].includes(customOrder.paymentStatus) && <div className="mt-5 space-y-3"><label><span className="form-label">Payment review note</span><textarea className="input-field min-h-24" maxLength="1000" value={paymentNote} onChange={(event) => setPaymentNote(event.target.value)} placeholder={customOrder.paymentStatus === 'Slip Submitted' ? 'Approval note or required rejection reason' : 'Optional collection note'} /></label>{customOrder.paymentStatus === 'Slip Submitted' ? <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-1"><button type="button" disabled={paymentSaving} className="primary-button" onClick={() => reviewPayment('approve')}><FiCheckCircle /> Approve Slip</button><button type="button" disabled={paymentSaving} className="secondary-button text-red-600" onClick={() => reviewPayment('reject')}><FiXCircle /> Reject Slip</button></div> : <button type="button" disabled={paymentSaving} className="primary-button w-full" onClick={() => reviewPayment('collect-cod')}><FiCheckCircle /> Mark COD Collected</button>}</div>}
          </section>

          <form onSubmit={handleSubmit(save)} className="form-section">
            <h2 className="font-serif text-2xl font-semibold">Manage Request</h2>
            <div className="mt-5 space-y-4">
              <label><span className="form-label">Status</span><select className="input-field" {...register('status')}>{statuses.map((status) => <option key={status}>{status}</option>)}</select></label>
              <label><span className="form-label">Quoted Price (LKR)</span><input type="number" min="0" step="0.01" className="input-field" placeholder="Enter confirmed price" {...register('quotedPrice')} /></label>
              <label><span className="form-label">Admin Note</span><textarea className="input-field min-h-32" maxLength="1000" placeholder="Pricing, availability, or consultation notes" {...register('adminNote')} /></label>
              <label><span className="form-label">Tracking Number</span><input className="input-field" maxLength="120" placeholder="Courier tracking reference" {...register('trackingNumber')} /></label>
              <label><span className="form-label">Estimated Delivery</span><input type="date" className="input-field" {...register('estimatedDelivery')} /></label>
              <LoadingButton type="submit" loading={saving} className="primary-button w-full">Save Custom Order</LoadingButton>
            </div>
          </form>

          {customOrder.quotedPrice !== null && customOrder.quotedPrice !== undefined && (
            <section className="rounded-[1.5rem] border border-gold/20 bg-pink-light/35 p-5 text-center">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted">Current Quote</p>
              <p className="mt-2 font-serif text-3xl font-semibold text-rosewood">{formatCurrency(customOrder.quotedPrice)}</p>
            </section>
          )}
        </aside>
      </div>
    </div>
  )
}

export default AdminCustomOrderDetailsPage
