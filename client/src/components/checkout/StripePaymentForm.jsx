import { PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js'
import { useState } from 'react'
import toast from 'react-hot-toast'
import LoadingButton from '../common/LoadingButton.jsx'
import { checkoutApi } from '../../services/checkoutApi.js'

function StripePaymentForm({ paymentIntentId, onComplete, onFailure }) {
  const stripe = useStripe(), elements = useElements(), [loading, setLoading] = useState(false)
  const pay = async (event) => {
    event.preventDefault(); if (!stripe || !elements) return
    setLoading(true)
    try {
      const { error, paymentIntent } = await stripe.confirmPayment({ elements, confirmParams: { return_url: `${window.location.origin}/order-success` }, redirect: 'if_required' })
      if (error) { await checkoutApi.recordStripeFailure(paymentIntentId).catch(() => {}); throw error }
      const order = await checkoutApi.verifyStripe(paymentIntent?.id || paymentIntentId)
      onComplete(order)
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || 'Card payment could not be completed.')
      onFailure?.(error)
    } finally { setLoading(false) }
  }
  return <form onSubmit={pay} className="mt-5"><div className="rounded-2xl border border-gold/20 bg-white p-4"><PaymentElement options={{ layout: 'tabs' }} /></div><LoadingButton type="submit" loading={loading} disabled={!stripe || !elements} className="primary-button mt-5 w-full">Pay Securely</LoadingButton><p className="mt-3 text-center text-[.68rem] text-muted">Card details are encrypted and handled directly by Stripe.</p></form>
}
export default StripePaymentForm
