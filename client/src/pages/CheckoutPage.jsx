import { useCallback, useEffect, useMemo, useState } from 'react'
import { FiArrowLeft, FiArrowRight, FiCreditCard, FiEdit2, FiMapPin, FiPlus, FiTrash2, FiTruck, FiUpload } from 'react-icons/fi'
import toast from 'react-hot-toast'
import { useDispatch, useSelector } from 'react-redux'
import { Link, useNavigate } from 'react-router-dom'
import AddressFormModal from '../components/account/AddressFormModal.jsx'
import CartItem from '../components/cart/CartItem.jsx'
import CheckoutProgress from '../components/checkout/CheckoutProgress.jsx'
import CheckoutSummary from '../components/checkout/CheckoutSummary.jsx'
import ConfirmModal from '../components/common/ConfirmModal.jsx'
import EmptyState from '../components/common/EmptyState.jsx'
import LoadingButton from '../components/common/LoadingButton.jsx'
import PageTransition from '../components/common/PageTransition.jsx'
import { addAddress, deleteAddress, setDefaultAddress, updateAddress } from '../redux/slices/authSlice.js'
import { fetchCart, removeCartItem, updateCartQuantity } from '../redux/slices/cartSlice.js'
import { checkoutApi } from '../services/checkoutApi.js'
import { formatCurrency } from '../utils/formatCurrency.js'
import { useBrand } from '../hooks/useBrand.js'

const PROGRESS_KEY = 'edw_checkout_progress'
const initialProgress = () => { try { return JSON.parse(localStorage.getItem(PROGRESS_KEY)) || {} } catch { return {} } }
const checkoutErrorMessage = (error, fallback) => {
  const errors = error.response?.data?.errors
  if (Array.isArray(errors) && errors.length) return errors.map((entry) => entry.message).filter(Boolean).join(' ')
  return error.response?.data?.message || fallback
}
const deliveryMethodLabels = [
  { id: 'standard', title: 'Standard Delivery', description: 'Delivered in approximately 3–5 business days', fee: 450 },
  { id: 'express', title: 'Express Delivery', description: 'Priority delivery in approximately 1–2 business days', fee: 900 },
  { id: 'pickup', title: 'Store Pickup', description: 'Collect your order when it is ready', fee: 0 },
]

function CheckoutPage() {
  const saved = useMemo(initialProgress, []), dispatch = useDispatch(), navigate = useNavigate()
  const { shipping } = useBrand()
  const { user, isLoading: addressLoading, error: addressError } = useSelector((state) => state.auth)
  const { items, isLoading: cartLoading } = useSelector((state) => state.cart)
  const [step, setStep] = useState(Math.min(3, Math.max(1, saved.step || 1)))
  const [selectedAddressId, setSelectedAddressId] = useState(saved.selectedAddressId || '')
  const [shippingMethod, setShippingMethod] = useState(saved.shippingMethod || 'standard')
  const [paymentMethod, setPaymentMethod] = useState(['COD', 'Bank Transfer'].includes(saved.paymentMethod) ? saved.paymentMethod : 'COD')
  const [quote, setQuote] = useState(null), [quoteLoading, setQuoteLoading] = useState(false)
  const [placing, setPlacing] = useState(false), [paymentConfig, setPaymentConfig] = useState({ methods: ['COD'], bankTransfer: { available: false } })
  const [paymentSlip, setPaymentSlip] = useState(null), [slipPreview, setSlipPreview] = useState(''), [paymentReference, setPaymentReference] = useState('')
  const [editor, setEditor] = useState({ open: false, address: null }), [removing, setRemoving] = useState(null)
  const addresses = useMemo(() => user?.addresses || [], [user?.addresses])
  const selectedAddress = addresses.find((address) => (address.id || address._id) === selectedAddressId)
  const shippingMethods = useMemo(() => deliveryMethodLabels.map((method) => {
    if (method.id === 'standard') return { ...method, fee: shipping.standardFee, description: `Delivered in approximately ${shipping.standardDays} business days` }
    if (method.id === 'express') return { ...method, fee: shipping.expressFee, description: `Priority delivery in approximately ${shipping.expressDays} business days` }
    return { ...method, fee: shipping.pickupFee, description: `Collect your order in approximately ${shipping.pickupDays} business day${shipping.pickupDays === 1 ? '' : 's'}` }
  }), [shipping])

  useEffect(() => {
    if (!selectedAddressId && addresses.length) setSelectedAddressId((addresses.find((address) => address.isDefault) || addresses[0]).id || (addresses.find((address) => address.isDefault) || addresses[0])._id)
  }, [addresses, selectedAddressId])
  useEffect(() => { localStorage.setItem(PROGRESS_KEY, JSON.stringify({ step, selectedAddressId, shippingMethod, paymentMethod })) }, [paymentMethod, selectedAddressId, shippingMethod, step])
  useEffect(() => {
    checkoutApi.paymentConfig().then((value) => {
      setPaymentConfig(value)
      if (!value.methods.includes(paymentMethod)) setPaymentMethod('COD')
    }).catch(() => setPaymentConfig({ methods: ['COD'], bankTransfer: { available: false } }))
  }, [paymentMethod])
  useEffect(() => () => { if (slipPreview) URL.revokeObjectURL(slipPreview) }, [slipPreview])

  const payload = useCallback(() => selectedAddress ? { shippingAddress: selectedAddress, billingAddress: selectedAddress, billingSameAsShipping: true, shippingMethod } : null, [selectedAddress, shippingMethod])
  const refreshQuote = useCallback(async ({ silent = false } = {}) => {
    const body = payload(); if (!body) return null
    setQuoteLoading(true)
    try { const value = await checkoutApi.quote(body); setQuote(value); return value } catch (error) { setQuote(null); if (!silent) toast.error(checkoutErrorMessage(error, 'Unable to calculate checkout totals.')); return null } finally { setQuoteLoading(false) }
  }, [payload])
  useEffect(() => { if (step >= 2 && selectedAddress && items.length) void refreshQuote({ silent: true }) }, [items.length, refreshQuote, selectedAddress, step])

  const saveAddress = async (values) => {
    try {
      const updatedUser = editor.address ? await dispatch(updateAddress({ addressId: editor.address.id || editor.address._id, body: values })).unwrap() : await dispatch(addAddress(values)).unwrap()
      const chosen = editor.address ? updatedUser.addresses.find((address) => (address.id || address._id) === (editor.address.id || editor.address._id)) : updatedUser.addresses.at(-1)
      if (chosen) setSelectedAddressId(chosen.id || chosen._id)
      setEditor({ open: false, address: null }); toast.success('Delivery address saved.')
    } catch { /* The modal displays the API error. */ }
  }
  const removeAddress = async () => { try { const id = removing.id || removing._id; const updatedUser = await dispatch(deleteAddress(id)).unwrap(); if (selectedAddressId === id) { const next = updatedUser.addresses.find((address) => address.isDefault) || updatedUser.addresses[0]; setSelectedAddressId(next ? next.id || next._id : '') } setRemoving(null); toast.success('Address removed.') } catch (error) { toast.error(error.message || 'Unable to remove address.') } }
  const makeDefault = async (id) => { try { await dispatch(setDefaultAddress(id)).unwrap(); setSelectedAddressId(id); toast.success('Default address updated.') } catch (error) { toast.error(error.message || 'Unable to update address.') } }
  const quantity = async (itemId, value) => { try { await dispatch(updateCartQuantity({ itemId, quantity: value })).unwrap(); await refreshQuote() } catch (error) { toast.error(error.message || 'Unable to change quantity.') } }
  const removeItem = async (id) => { try { await dispatch(removeCartItem(id)).unwrap(); toast.success('Item removed.'); await refreshQuote({ silent: true }) } catch (error) { toast.error(error.message || 'Unable to remove item.') } }

  const next = async () => {
    if (step === 1 && !selectedAddress) return toast.error('Select or add a delivery address.')
    if (step < 3) { const value = await refreshQuote(); if (!value) return; setStep(step + 1) }
  }
  const back = () => setStep((current) => Math.max(1, current - 1))
  const complete = async (order) => { localStorage.removeItem(PROGRESS_KEY); await dispatch(fetchCart()); navigate('/order-success', { replace: true, state: { order } }) }
  const createCodOrder = async () => { setPlacing(true); try { const currentQuote = await refreshQuote(); if (!currentQuote) return; const order = await checkoutApi.createCodOrder(payload()); toast.success('Order placed successfully.'); await complete(order) } catch (error) { toast.error(checkoutErrorMessage(error, 'Unable to place your order.')) } finally { setPlacing(false) } }
  const selectSlip = (event) => {
    const file = event.target.files?.[0] || null
    if (file && file.size > 12 * 1024 * 1024) { toast.error('Payment slip must be smaller than 12 MB.'); event.target.value = ''; return }
    setPaymentSlip(file)
    setSlipPreview(file ? URL.createObjectURL(file) : '')
  }
  const createBankTransferOrder = async () => {
    if (!paymentSlip) return toast.error('Upload your bank payment slip first.')
    setPlacing(true)
    try {
      const currentQuote = await refreshQuote()
      if (!currentQuote) return
      const order = await checkoutApi.createBankTransferOrder(payload(), paymentSlip, paymentReference)
      toast.success('Payment slip submitted for verification.')
      await complete(order)
    } catch (error) { toast.error(checkoutErrorMessage(error, 'Unable to submit the payment slip.')) }
    finally { setPlacing(false) }
  }

  if (!items.length) return <PageTransition><section className="section-shell py-16"><EmptyState title="Your cart is empty" message="Add at least one creation before starting checkout." action={<Link to="/shop" className="primary-button">Explore Collections</Link>} /></section></PageTransition>
  return <PageTransition><section className="bg-pink-light/20 py-9 sm:py-12"><div className="section-shell"><div className="mx-auto max-w-2xl"><p className="text-center text-xs font-semibold uppercase tracking-[.22em] text-gold">Secure Checkout</p><h1 className="mt-2 text-center font-serif text-4xl font-semibold sm:text-5xl">Complete Your Order</h1><div className="mt-8"><CheckoutProgress step={step} /></div></div><div className="mt-10 grid items-start gap-7 lg:grid-cols-[minmax(0,1fr)_370px]"><div className="min-w-0">
    {step === 1 && <section className="form-section"><div className="flex flex-wrap items-center justify-between gap-4"><div><h2 className="form-section-title"><span><FiMapPin /></span> Delivery Address</h2><p className="mt-2 text-sm text-muted">Choose where your handcrafted order should be delivered.</p></div><button type="button" className="secondary-button" onClick={() => setEditor({ open: true, address: null })}><FiPlus /> Add Address</button></div><div className="mt-6 grid gap-4 md:grid-cols-2">{addresses.map((address) => { const id = address.id || address._id, chosen = id === selectedAddressId; return <article key={id} className={`rounded-2xl border p-5 transition ${chosen ? 'border-rosewood bg-pink-light/35 shadow-luxury' : 'border-gold/15 bg-white'}`}><label className="flex cursor-pointer gap-3"><input type="radio" name="address" checked={chosen} onChange={() => setSelectedAddressId(id)} className="mt-1 accent-rosewood" /><span className="text-sm"><strong>{address.label}{address.isDefault && ' · Default'}</strong><span className="mt-2 block leading-6 text-muted">{address.fullName}<br />{address.addressLine1}{address.addressLine2 && `, ${address.addressLine2}`}<br />{address.city}, {address.district}<br />{address.phone}</span></span></label><div className="mt-4 flex flex-wrap gap-2">{!address.isDefault && <button type="button" className="secondary-button min-h-9 px-3 text-xs" onClick={() => makeDefault(id)}>Set Default</button>}<button type="button" className="icon-button h-9 w-9" onClick={() => setEditor({ open: true, address })}><FiEdit2 /></button><button type="button" className="icon-button h-9 w-9 text-red-600" onClick={() => setRemoving(address)}><FiTrash2 /></button></div></article> })}</div>{!addresses.length && <p className="mt-6 rounded-2xl bg-pink-light/50 p-5 text-sm text-muted">Add a Sri Lankan delivery address to continue.</p>}</section>}
    {step === 2 && <div className="space-y-6"><section className="form-section"><div className="flex items-center justify-between gap-4"><h2 className="form-section-title"><span><FiTruck /></span> Review Your Order</h2><Link to="/cart" className="text-xs font-semibold text-rosewood hover:underline">Return to cart</Link></div><div className="mt-5 space-y-4">{items.map((item) => <CartItem key={item.id || item._id} item={item} onQuantity={quantity} onRemove={removeItem} disabled={cartLoading || quoteLoading} />)}</div></section><section className="form-section"><h2 className="font-serif text-2xl font-semibold">Shipping Method</h2><div className="mt-5 grid gap-3">{shippingMethods.map((method) => <label key={method.id} className={`flex cursor-pointer items-center gap-4 rounded-2xl border p-4 ${shippingMethod === method.id ? 'border-rosewood bg-pink-light/35' : 'border-gold/15'}`}><input type="radio" checked={shippingMethod === method.id} onChange={() => setShippingMethod(method.id)} className="accent-rosewood" /><span className="flex-1"><strong className="text-sm">{method.title}</strong><span className="block text-xs text-muted">{method.description}</span></span><strong className="text-sm">{method.fee ? formatCurrency(method.fee) : 'Free'}</strong></label>)}</div></section></div>}
    {step === 3 && <section className="form-section"><h2 className="form-section-title"><span><FiCreditCard /></span> Payment Method</h2><p className="mt-2 text-sm text-muted">Choose Cash on Delivery or transfer to the owner’s bank account and upload your payment slip.</p><div className="mt-6 grid gap-3 sm:grid-cols-2"><label className={`cursor-pointer rounded-2xl border p-5 ${paymentMethod === 'COD' ? 'border-rosewood bg-pink-light/35' : 'border-gold/15'}`}><input type="radio" name="paymentMethod" className="accent-rosewood" checked={paymentMethod === 'COD'} onChange={() => setPaymentMethod('COD')} /><strong className="ml-3 text-sm">Cash on Delivery</strong><p className="mt-2 text-xs leading-5 text-muted">Pay when your order arrives. Payment remains pending until delivery.</p></label>{paymentConfig.methods.includes('Bank Transfer') ? <label className={`cursor-pointer rounded-2xl border p-5 ${paymentMethod === 'Bank Transfer' ? 'border-rosewood bg-pink-light/35' : 'border-gold/15'}`}><input type="radio" name="paymentMethod" className="accent-rosewood" checked={paymentMethod === 'Bank Transfer'} onChange={() => setPaymentMethod('Bank Transfer')} /><strong className="ml-3 text-sm">Online Bank Transfer</strong><p className="mt-2 text-xs leading-5 text-muted">Transfer manually, then upload a clear photo or image of the payment slip.</p></label> : <div className="rounded-2xl border border-dashed border-gold/25 bg-slate-50 p-5 opacity-75"><strong className="text-sm">Online Bank Transfer</strong><span className="ml-2 rounded-full bg-amber-100 px-2 py-1 text-[.62rem] font-bold uppercase text-amber-800">Unavailable</span><p className="mt-2 text-xs leading-5 text-muted">The owner’s bank account details have not been configured yet. Please use Cash on Delivery.</p></div>}</div>{paymentMethod === 'COD' && <LoadingButton type="button" loading={placing} onClick={createCodOrder} className="primary-button mt-6 w-full">Place Cash on Delivery Order</LoadingButton>}{paymentMethod === 'Bank Transfer' && paymentConfig.bankTransfer?.available && <div className="mt-6 space-y-5"><div className="rounded-2xl border border-gold/20 bg-cream p-5"><h3 className="font-serif text-xl font-semibold">Owner’s Bank Account</h3><dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2"><div><dt className="text-muted">Bank</dt><dd className="font-semibold">{paymentConfig.bankTransfer.bankName}</dd></div><div><dt className="text-muted">Account holder</dt><dd className="font-semibold">{paymentConfig.bankTransfer.accountName}</dd></div><div><dt className="text-muted">Account number</dt><dd className="break-all font-semibold">{paymentConfig.bankTransfer.accountNumber}</dd></div><div><dt className="text-muted">Branch</dt><dd className="font-semibold">{paymentConfig.bankTransfer.branch}{paymentConfig.bankTransfer.branchCode ? ` (${paymentConfig.bankTransfer.branchCode})` : ''}</dd></div></dl>{paymentConfig.bankTransfer.instructions && <p className="mt-4 text-xs leading-5 text-muted">{paymentConfig.bankTransfer.instructions}</p>}<p className="mt-4 rounded-xl bg-pink-light/50 p-3 text-xs leading-5 text-muted">Transfer exactly <strong className="text-ink">{formatCurrency(quote?.total || 0)}</strong>. Your order will be processed after the administrator verifies the uploaded slip.</p></div><label className="block"><span className="form-label">Payment reference (optional)</span><input className="input-field" maxLength="120" value={paymentReference} onChange={(event) => setPaymentReference(event.target.value)} placeholder="Bank reference or transaction ID" /></label><label className="block"><span className="form-label">Payment slip</span><span className="mt-2 flex min-h-36 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gold/30 bg-white p-5 text-center transition hover:border-rosewood"><FiUpload className="text-2xl text-rosewood" /><strong className="mt-2 text-sm">Choose a photo or image</strong><span className="mt-1 text-xs text-muted">Phone and computer uploads supported · JPEG, PNG, WebP, AVIF, HEIC or HEIF · Max 12 MB</span><input type="file" className="sr-only" accept="image/*,.heic,.heif" onChange={selectSlip} /></span></label>{slipPreview && <img src={slipPreview} alt="Selected payment slip preview" className="max-h-80 w-full rounded-2xl border border-gold/15 bg-cream object-contain" />}<LoadingButton type="button" loading={placing} onClick={createBankTransferOrder} className="primary-button w-full">Submit Payment Slip & Place Order</LoadingButton></div>}</section>}
    <div className="mt-6 flex justify-between gap-3">{step > 1 ? <button type="button" className="secondary-button" onClick={back}><FiArrowLeft /> Back</button> : <Link to="/cart" className="secondary-button"><FiArrowLeft /> Cart</Link>}{step < 3 && <LoadingButton type="button" loading={quoteLoading} onClick={next} className="primary-button">Continue <FiArrowRight /></LoadingButton>}</div>
  </div><CheckoutSummary quote={quote} /></div></div><AddressFormModal open={editor.open} address={editor.address} onClose={() => setEditor({ open: false, address: null })} onSubmit={saveAddress} loading={addressLoading} apiError={addressError?.message} /><ConfirmModal open={Boolean(removing)} title="Delete this address?" message="This saved address will be permanently removed." confirmLabel="Delete Address" onClose={() => setRemoving(null)} onConfirm={removeAddress} loading={addressLoading} /></section></PageTransition>
}

export default CheckoutPage
