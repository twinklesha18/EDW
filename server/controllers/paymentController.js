import { env } from '../config/env.js'
import stripe, { isStripeConfigured } from '../config/stripe.js'
import CheckoutSession from '../models/CheckoutSession.js'
import Order from '../models/Order.js'
import User from '../models/User.js'
import { buildCheckoutQuote, createOrderFromQuote, publicQuote } from '../services/checkoutService.js'
import { orderConfirmationEmail, paymentFailedEmail, paymentSuccessEmail } from '../services/emailTemplates.js'
import { sendEmailSafely } from '../services/emailService.js'
import { AppError, sendSuccess } from '../utils/responseUtils.js'

export async function createStripePaymentIntent(request, response) {
  if (!isStripeConfigured) throw new AppError('Stripe is not configured on this server', 503)
  const quote = await buildCheckoutQuote(request.user._id, request.validatedBody)
  const checkoutSession = await CheckoutSession.create({
    user: request.user._id, items: quote.items, shippingAddress: quote.shippingAddress, billingAddress: quote.billingAddress,
    shippingMethod: quote.shippingMethod, couponCode: quote.couponCode, coupon: quote.coupon,
    subtotal: quote.subtotal, shippingFee: quote.shippingFee, discount: quote.discount, total: quote.total,
    estimatedDelivery: quote.estimatedDelivery, expiresAt: new Date(Date.now() + 30 * 60 * 1000),
  })
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(quote.total * 100), currency: 'lkr', payment_method_types: ['card'], receipt_email: request.user.email,
      description: `Eshaz Dream World checkout for ${request.user.email}`,
      metadata: { userId: String(request.user._id), checkoutSessionId: String(checkoutSession._id) },
    }, { idempotencyKey: `edw-checkout-${checkoutSession._id}` })
    checkoutSession.paymentIntentId = paymentIntent.id
    await checkoutSession.save()
    return sendSuccess(response, { statusCode: 201, message: 'Secure card payment initialized', data: { clientSecret: paymentIntent.client_secret, paymentIntentId: paymentIntent.id, publishableKey: env.stripe.publishableKey, quote: publicQuote(quote) } })
  } catch (error) {
    await CheckoutSession.deleteOne({ _id: checkoutSession._id })
    throw new AppError(error.message || 'Unable to initialize card payment', 502)
  }
}

export async function verifyStripePayment(request, response) {
  if (!isStripeConfigured) throw new AppError('Stripe is not configured on this server', 503)
  const { paymentIntentId } = request.validatedBody
  const existingOrder = await Order.findOne({ 'payment.intentId': paymentIntentId, user: request.user._id })
  if (existingOrder) return sendSuccess(response, { message: 'Payment was already completed', data: { order: existingOrder } })
  const checkoutSession = await CheckoutSession.findOne({ paymentIntentId, user: request.user._id, status: 'Pending', expiresAt: { $gt: new Date() } })
  if (!checkoutSession) throw new AppError('Checkout session is invalid or has expired', 400)
  const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId)
  const validOwner = paymentIntent.metadata?.userId === String(request.user._id) && paymentIntent.metadata?.checkoutSessionId === String(checkoutSession._id)
  const validAmount = paymentIntent.amount === Math.round(checkoutSession.total * 100) && paymentIntent.currency === 'lkr'
  if (!validOwner || !validAmount) throw new AppError('Payment verification failed', 400)
  if (paymentIntent.status !== 'succeeded') {
    if (['requires_payment_method', 'canceled'].includes(paymentIntent.status)) {
      checkoutSession.status = 'Failed'; checkoutSession.failureReason = paymentIntent.last_payment_error?.message || 'Payment was not completed'; await checkoutSession.save()
      void sendEmailSafely({ to: request.user.email, ...paymentFailedEmail(request.user, env.clientOrigins[0]) })
    }
    throw new AppError(`Payment is not complete (${paymentIntent.status})`, 409)
  }
  const quote = checkoutSession.toObject()
  const { order } = await createOrderFromQuote({ user: request.user, quote, paymentMethod: 'Stripe', paymentIntent })
  checkoutSession.status = 'Completed'; await checkoutSession.save()
  void sendEmailSafely({ to: request.user.email, ...orderConfirmationEmail(request.user, order, env.clientOrigins[0]) })
  void sendEmailSafely({ to: request.user.email, ...paymentSuccessEmail(request.user, order, env.clientOrigins[0]) })
  return sendSuccess(response, { statusCode: 201, message: 'Payment verified and order created', data: { order } })
}

export async function recordStripeFailure(request, response) {
  const checkoutSession = await CheckoutSession.findOne({ paymentIntentId: request.validatedBody.paymentIntentId, user: request.user._id, status: 'Pending' })
  if (checkoutSession) { checkoutSession.status = 'Failed'; checkoutSession.failureReason = 'Customer payment confirmation failed'; await checkoutSession.save() }
  void sendEmailSafely({ to: request.user.email, ...paymentFailedEmail(request.user, env.clientOrigins[0]) })
  return sendSuccess(response, { message: 'Payment failure recorded' })
}

export async function handleStripeWebhook(request, response) {
  if (!isStripeConfigured || !env.stripe.webhookSecret) throw new AppError('Stripe webhook is not configured', 503)
  let event
  try { event = stripe.webhooks.constructEvent(request.body, request.headers['stripe-signature'], env.stripe.webhookSecret) } catch { throw new AppError('Stripe webhook signature is invalid', 400) }
  if (event.type === 'payment_intent.succeeded') {
    const paymentIntent = event.data.object
    const existing = await Order.findOne({ 'payment.intentId': paymentIntent.id })
    if (!existing) {
      const checkoutSession = await CheckoutSession.findOne({ paymentIntentId: paymentIntent.id, status: 'Pending' })
      if (checkoutSession) {
        const user = await User.findById(checkoutSession.user)
        if (user && paymentIntent.amount === Math.round(checkoutSession.total * 100) && paymentIntent.currency === 'lkr' && paymentIntent.metadata?.userId === String(user._id) && paymentIntent.metadata?.checkoutSessionId === String(checkoutSession._id)) {
          const { order } = await createOrderFromQuote({ user, quote: checkoutSession.toObject(), paymentMethod: 'Stripe', paymentIntent })
          checkoutSession.status = 'Completed'; await checkoutSession.save()
          void sendEmailSafely({ to: user.email, ...orderConfirmationEmail(user, order, env.clientOrigins[0]) })
          void sendEmailSafely({ to: user.email, ...paymentSuccessEmail(user, order, env.clientOrigins[0]) })
        }
      }
    }
  }
  if (event.type === 'payment_intent.payment_failed') {
    const paymentIntent = event.data.object
    const checkoutSession = await CheckoutSession.findOne({ paymentIntentId: paymentIntent.id, status: 'Pending' })
    if (checkoutSession) {
      checkoutSession.status = 'Failed'; checkoutSession.failureReason = paymentIntent.last_payment_error?.message || 'Stripe payment failed'; await checkoutSession.save()
      const user = await User.findById(checkoutSession.user)
      if (user) void sendEmailSafely({ to: user.email, ...paymentFailedEmail(user, env.clientOrigins[0]) })
    }
  }
  return response.status(200).json({ received: true })
}
