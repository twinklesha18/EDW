import { Elements } from '@stripe/react-stripe-js'
import { loadStripe } from '@stripe/stripe-js'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { FiArrowLeft, FiArrowRight, FiCreditCard, FiEdit2, FiMapPin, FiPlus, FiTrash2, FiTruck } from 'react-icons/fi'
import toast from 'react-hot-toast'
import { useDispatch, useSelector } from 'react-redux'
import { Link, useNavigate } from 'react-router-dom'
import AddressFormModal from '../components/account/AddressFormModal.jsx'
import CartItem from '../components/cart/CartItem.jsx'
import CheckoutProgress from '../components/checkout/CheckoutProgress.jsx'
import CheckoutSummary from '../components/checkout/CheckoutSummary.jsx'
import StripePaymentForm from '../components/checkout/StripePaymentForm.jsx'
import ConfirmModal from '../components/common/ConfirmModal.jsx'
import EmptyState from '../components/common/EmptyState.jsx'
import LoadingButton from '../components/common/LoadingButton.jsx'
import PageTransition from '../components/common/PageTransition.jsx'
import { addAddress, deleteAddress, setDefaultAddress, updateAddress } from '../redux/slices/authSlice.js'
import { fetchCart, removeCartItem, updateCartQuantity } from '../redux/slices/cartSlice.js'
import { checkoutApi } from '../services/checkoutApi.js'
import { formatCurrency } from '../utils/formatCurrency.js'

const PROGRESS_KEY = 'edw_checkout_progress'
const initialProgress = () => { try { return JSON.parse(localStorage.getItem(PROGRESS_KEY)) || {} } catch { return {} } }
const methods = [
  { id: 'standard', title: 'Standard Delivery', description: 'Delivered in approximately 3–5 business days', fee: 450 },
  { id: 'express', title: 'Express Delivery', description: 'Priority delivery in approximately 1–2 business days', fee: 900 },
  { id: 'pickup', title: 'Store Pickup', description: 'Collect your order when it is ready', fee: 0 },
]

function CheckoutPage() {
  const saved = useMemo(initialProgress, []), dispatch = useDispatch(), navigate = useNavigate()
  const { user, isLoading: addressLoading, error: addressError } = useSelector((state) => state.auth)
  const { items, isLoading: cartLoading } = useSelector((state) => state.cart)
  const [step, setStep] = useState(Math.min(3, Math.max(1, saved.step || 1)))
  const [selectedAddressId, setSelectedAddressId] = useState(saved.selectedAddressId || '')
  const [shippingMethod, setShippingMethod] = useState(saved.shippingMethod || 'standard')
  const [couponCode, setCouponCode] = useState(saved.couponCode || '')
  const [paymentMethod, setPaymentMethod] = useState(saved.paymentMethod || 'COD')
  const [quote, setQuote] = useState(null), [quoteLoading, setQuoteLoading] = useState(false)
  const [placing, setPlacing] = useState(false), [stripeData, setStripeData] = useState(null)
  const [editor, setEditor] = useState({ open: false, address: null }), [removing, setRemoving] = useState(null)
  const addresses = useMemo(() => user?.addresses || [], [user?.addresses])
  const selectedAddress = addresses.find((address) => (address.id || address._id) === selectedAddressId)

  useEffect(() => {
    if (!selectedAddressId && addresses.length) setSelectedAddressId((addresses.find((address) => address.isDefault) || addresses[0]).id || (addresses.find((address) => address.isDefault) || addresses[0])._id)
  }, [addresses, selectedAddressId])
  useEffect(() => { localStorage.setItem(PROGRESS_KEY, JSON.stringify({ step, selectedAddressId, shippingMethod, couponCode, paymentMethod })) }, [couponCode, paymentMethod, selectedAddressId, shippingMethod, step])

  const payload = useCallback(() => selectedAddress ? { shippingAddress: selectedAddress, billingAddress: selectedAddress, billingSameAsShipping: true, shippingMethod, couponCode } : null, [couponCode, selectedAddress, shippingMethod])
  const refreshQuote = useCallback(async ({ silent = false } = {}) => {
    const body = payload(); if (!body) return null
    setQuoteLoading(true)
    try { const value = await checkoutApi.quote(body); setQuote(value); return value } catch (error) { setQuote(null); if (!silent) toast.error(error.response?.data?.message || 'Unable to calculate checkout totals.'); return null } finally { setQuoteLoading(false) }
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
    if (step < 3) { const value = await refreshQuote(); if (!value) return; setStripeData(null); setStep(step + 1) }
  }
  const back = () => { setStripeData(null); setStep((current) => Math.max(1, current - 1)) }
  const complete = async (order) => { localStorage.removeItem(PROGRESS_KEY); await dispatch(fetchCart()); navigate('/order-success', { replace: true, state: { order } }) }
  const createCodOrder = async () => { setPlacing(true); try { const order = await checkoutApi.createCodOrder(payload()); toast.success('Order placed successfully.'); await complete(order) } catch (error) { toast.error(error.response?.data?.message || 'Unable to place your order.') } finally { setPlacing(false) } }
  const initializeStripe = async () => { setPlacing(true); try { const result = await checkoutApi.createStripeIntent(payload()); if (!result.publishableKey) throw new Error('Stripe publishable key is missing.'); setStripeData(result) } catch (error) { toast.error(error.response?.data?.message || error.message || 'Unable to initialize Stripe.') } finally { setPlacing(false) } }
  const stripePromise = useMemo(() => stripeData?.publishableKey ? loadStripe(stripeData.publishableKey) : null, [stripeData?.publishableKey])

  if (!items.length) return <PageTransition><section className="section-shell py-16"><EmptyState title="Your cart is empty" message="Add at least one creation before starting checkout." action={<Link to="/shop" className="primary-button">Explore Collections</Link>} /></section></PageTransition>
  return <PageTransition><section className="bg-pink-light/20 py-9 sm:py-12"><div className="section-shell"><div className="mx-auto max-w-2xl"><p className="text-center text-xs font-semibold uppercase tracking-[.22em] text-gold">Secure Checkout</p><h1 className="mt-2 text-center font-serif text-4xl font-semibold sm:text-5xl">Complete Your Order</h1><div className="mt-8"><CheckoutProgress step={step} /></div></div><div className="mt-10 grid items-start gap-7 lg:grid-cols-[minmax(0,1fr)_370px]"><div className="min-w-0">
    {step === 1 && <section className="form-section"><div className="flex flex-wrap items-center justify-between gap-4"><div><h2 className="form-section-title"><span><FiMapPin /></span> Delivery Address</h2><p className="mt-2 text-sm text-muted">Choose where your handcrafted order should be delivered.</p></div><button type="button" className="secondary-button" onClick={() => setEditor({ open: true, address: null })}><FiPlus /> Add Address</button></div><div className="mt-6 grid gap-4 md:grid-cols-2">{addresses.map((address) => { const id = address.id || address._id, chosen = id === selectedAddressId; return <article key={id} className={`rounded-2xl border p-5 transition ${chosen ? 'border-rosewood bg-pink-light/35 shadow-luxury' : 'border-gold/15 bg-white'}`}><label className="flex cursor-pointer gap-3"><input type="radio" name="address" checked={chosen} onChange={() => setSelectedAddressId(id)} className="mt-1 accent-rosewood" /><span className="text-sm"><strong>{address.label}{address.isDefault && ' · Default'}</strong><span className="mt-2 block leading-6 text-muted">{address.fullName}<br />{address.addressLine1}{address.addressLine2 && `, ${address.addressLine2}`}<br />{address.city}, {address.district}<br />{address.phone}</span></span></label><div className="mt-4 flex flex-wrap gap-2">{!address.isDefault && <button type="button" className="secondary-button min-h-9 px-3 text-xs" onClick={() => makeDefault(id)}>Set Default</button>}<button type="button" className="icon-button h-9 w-9" onClick={() => setEditor({ open: true, address })}><FiEdit2 /></button><button type="button" className="icon-button h-9 w-9 text-red-600" onClick={() => setRemoving(address)}><FiTrash2 /></button></div></article> })}</div>{!addresses.length && <p className="mt-6 rounded-2xl bg-pink-light/50 p-5 text-sm text-muted">Add a Sri Lankan delivery address to continue.</p>}</section>}
    {step === 2 && <div className="space-y-6"><section className="form-section"><div className="flex items-center justify-between gap-4"><h2 className="form-section-title"><span><FiTruck /></span> Review Your Order</h2><Link to="/cart" className="text-xs font-semibold text-rosewood hover:underline">Return to cart</Link></div><div className="mt-5 space-y-4">{items.map((item) => <CartItem key={item.id || item._id} item={item} onQuantity={quantity} onRemove={removeItem} disabled={cartLoading || quoteLoading} />)}</div></section><section className="form-section"><h2 className="font-serif text-2xl font-semibold">Shipping & Coupon</h2><div className="mt-5 grid gap-3">{methods.map((method) => <label key={method.id} className={`flex cursor-pointer items-center gap-4 rounded-2xl border p-4 ${shippingMethod === method.id ? 'border-rosewood bg-pink-light/35' : 'border-gold/15'}`}><input type="radio" checked={shippingMethod === method.id} onChange={() => { setShippingMethod(method.id); setStripeData(null) }} className="accent-rosewood" /><span className="flex-1"><strong className="text-sm">{method.title}</strong><span className="block text-xs text-muted">{method.description}</span></span><strong className="text-sm">{method.fee ? formatCurrency(method.fee) : 'Free'}</strong></label>)}</div><div className="mt-5 flex gap-3"><input className="input-field" placeholder="Coupon code" value={couponCode} onChange={(event) => setCouponCode(event.target.value.toUpperCase())} /><LoadingButton type="button" loading={quoteLoading} className="secondary-button shrink-0" onClick={() => refreshQuote()}>Apply</LoadingButton></div></section></div>}
    {step === 3 && <section className="form-section"><h2 className="form-section-title"><span><FiCreditCard /></span> Payment Method</h2><p className="mt-2 text-sm text-muted">Choose how you would like to complete this order.</p><div className="mt-6 grid gap-3 sm:grid-cols-2"><label className={`cursor-pointer rounded-2xl border p-5 ${paymentMethod === 'COD' ? 'border-rosewood bg-pink-light/35' : 'border-gold/15'}`}><input type="radio" className="accent-rosewood" checked={paymentMethod === 'COD'} onChange={() => { setPaymentMethod('COD'); setStripeData(null) }} /><strong className="ml-3 text-sm">Cash on Delivery</strong><p className="mt-2 text-xs leading-5 text-muted">Pay when your order arrives. Payment remains pending until delivery.</p></label><label className={`cursor-pointer rounded-2xl border p-5 ${paymentMethod === 'Stripe' ? 'border-rosewood bg-pink-light/35' : 'border-gold/15'}`}><input type="radio" className="accent-rosewood" checked={paymentMethod === 'Stripe'} onChange={() => { setPaymentMethod('Stripe'); setStripeData(null) }} /><strong className="ml-3 text-sm">Card with Stripe</strong><p className="mt-2 text-xs leading-5 text-muted">Secure card payment with Stripe Elements and bank authentication.</p></label></div>{paymentMethod === 'COD' && <LoadingButton type="button" loading={placing} onClick={createCodOrder} className="primary-button mt-6 w-full">Place Cash on Delivery Order</LoadingButton>}{paymentMethod === 'Stripe' && !stripeData && <LoadingButton type="button" loading={placing} onClick={initializeStripe} className="primary-button mt-6 w-full">Continue to Secure Card Entry</LoadingButton>}{paymentMethod === 'Stripe' && stripeData && stripePromise && <Elements stripe={stripePromise} options={{ clientSecret: stripeData.clientSecret, appearance: { theme: 'stripe', variables: { colorPrimary: '#A94F73', colorText: '#3B2F36', borderRadius: '12px', fontFamily: 'Poppins, sans-serif' } } }}><StripePaymentForm paymentIntentId={stripeData.paymentIntentId} onComplete={complete} onFailure={() => navigate('/order-failed')} /></Elements>}</section>}
    <div className="mt-6 flex justify-between gap-3">{step > 1 ? <button type="button" className="secondary-button" onClick={back}><FiArrowLeft /> Back</button> : <Link to="/cart" className="secondary-button"><FiArrowLeft /> Cart</Link>}{step < 3 && <LoadingButton type="button" loading={quoteLoading} onClick={next} className="primary-button">Continue <FiArrowRight /></LoadingButton>}</div>
  </div><CheckoutSummary quote={quote} /></div></div><AddressFormModal open={editor.open} address={editor.address} onClose={() => setEditor({ open: false, address: null })} onSubmit={saveAddress} loading={addressLoading} apiError={addressError?.message} /><ConfirmModal open={Boolean(removing)} title="Delete this address?" message="This saved address will be permanently removed." confirmLabel="Delete Address" onClose={() => setRemoving(null)} onConfirm={removeAddress} loading={addressLoading} /></section></PageTransition>
}

export default CheckoutPage
