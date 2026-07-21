import assert from 'node:assert/strict'
process.env.STRIPE_SECRET_KEY = 'sk_test_phase5_local_verification'
process.env.STRIPE_PUBLISHABLE_KEY = 'pk_test_phase5_local_verification'
process.env.STRIPE_WEBHOOK_SECRET = 'whsec_phase5_local_verification'

const mongoose = (await import('mongoose')).default
const { env } = await import('../config/env.js')
const { default: stripe } = await import('../config/stripe.js')
const { default: app } = await import('../app.js')
const { default: Cart } = await import('../models/Cart.js')
const { default: Category } = await import('../models/Category.js')
const { default: CheckoutSession } = await import('../models/CheckoutSession.js')
const { default: Order } = await import('../models/Order.js')
const { default: Product } = await import('../models/Product.js')
const { default: User } = await import('../models/User.js')

const port = 5103, suffix = Date.now(), base = `http://127.0.0.1:${port}/api/payments/stripe/webhook`
let server, user, category, product, checkoutSession, failedSession
const address = { fullName: 'Stripe Test Customer', phone: '0760894222', addressLine1: '1 Stripe Lane', addressLine2: '', city: 'Colombo', district: 'Colombo', province: 'Western', postalCode: '00100', country: 'Sri Lanka' }
const webhook = async (event, signatureSecret = env.stripe.webhookSecret) => {
  const payload = JSON.stringify(event), signature = stripe.webhooks.generateTestHeaderString({ payload, secret: signatureSecret })
  const response = await fetch(base, { method: 'POST', headers: { 'Content-Type': 'application/json', 'stripe-signature': signature }, body: payload })
  return { status: response.status, body: await response.json() }
}
try {
  await mongoose.connect(env.mongoUri); server = app.listen(port); await new Promise((resolve) => server.once('listening', resolve))
  user = await User.create({ firstName: 'Stripe', lastName: 'Customer', email: `phase5-stripe-${suffix}@example.com`, phone: '0760894222', password: 'SecureStripe1' })
  category = await Category.create({ name: `Stripe Test ${suffix}`, slug: `stripe-test-${suffix}`, description: 'Stripe webhook verification category', isActive: true })
  product = await Product.create({ name: 'Stripe Verification Gift', slug: `stripe-gift-${suffix}`, description: 'Product used to verify signed Stripe webhook order completion.', shortDescription: 'Stripe webhook product.', price: 5000, sku: `EDW-STRIPE-${suffix}`, category: category._id, thumbnail: { url: 'https://example.com/stripe.webp', alt: 'Stripe gift' }, stock: 4, sold: 0, isActive: true })
  const items = [{ product: product._id, name: product.name, slug: product.slug, sku: product.sku, image: product.thumbnail.url, price: 5000, quantity: 1, customization: {} }]
  await Cart.create({ user: user._id, items: [{ productId: String(product._id), signature: `${product._id}:stripe`, name: product.name, slug: product.slug, image: product.thumbnail.url, price: 1, quantity: 1, stock: 999, category: category.name, customization: {} }], subtotal: 1 })
  checkoutSession = await CheckoutSession.create({ user: user._id, paymentIntentId: `pi_phase5_success_${suffix}`, items, shippingAddress: address, billingAddress: address, shippingMethod: 'standard', subtotal: 5000, shippingFee: 450, discount: 0, total: 5450, estimatedDelivery: new Date(Date.now() + 5 * 86400000), expiresAt: new Date(Date.now() + 1800000) })
  const succeeded = { id: `evt_success_${suffix}`, object: 'event', type: 'payment_intent.succeeded', data: { object: { id: checkoutSession.paymentIntentId, object: 'payment_intent', amount: 545000, currency: 'lkr', status: 'succeeded', latest_charge: `ch_phase5_${suffix}`, metadata: { userId: String(user._id), checkoutSessionId: String(checkoutSession._id) } } } }
  let result = await webhook(succeeded, 'wrong_secret'); assert.equal(result.status, 400, 'Invalid webhook signatures must fail')
  result = await webhook(succeeded); assert.equal(result.status, 200); assert.equal(result.body.received, true)
  let order = await Order.findOne({ 'payment.intentId': checkoutSession.paymentIntentId }); assert.ok(order); assert.equal(order.paymentStatus, 'Paid'); assert.equal(order.paymentMethod, 'Stripe'); assert.equal(order.total, 5450)
  product = await Product.findById(product._id); assert.equal(product.stock, 3); assert.equal(product.sold, 1)
  let cart = await Cart.findOne({ user: user._id }); assert.equal(cart.items.length, 0)
  checkoutSession = await CheckoutSession.findById(checkoutSession._id); assert.equal(checkoutSession.status, 'Completed')
  result = await webhook(succeeded); assert.equal(result.status, 200); assert.equal(await Order.countDocuments({ 'payment.intentId': checkoutSession.paymentIntentId }), 1, 'Duplicate webhooks must not duplicate orders')
  product = await Product.findById(product._id); assert.equal(product.stock, 3, 'Duplicate webhooks must not decrement stock twice')

  failedSession = await CheckoutSession.create({ user: user._id, paymentIntentId: `pi_phase5_failed_${suffix}`, items, shippingAddress: address, billingAddress: address, shippingMethod: 'standard', subtotal: 5000, shippingFee: 450, discount: 0, total: 5450, estimatedDelivery: new Date(Date.now() + 5 * 86400000), expiresAt: new Date(Date.now() + 1800000) })
  const failed = { id: `evt_failed_${suffix}`, object: 'event', type: 'payment_intent.payment_failed', data: { object: { id: failedSession.paymentIntentId, object: 'payment_intent', last_payment_error: { message: 'Test card was declined' }, metadata: { userId: String(user._id), checkoutSessionId: String(failedSession._id) } } } }
  result = await webhook(failed); assert.equal(result.status, 200); failedSession = await CheckoutSession.findById(failedSession._id); assert.equal(failedSession.status, 'Failed'); assert.match(failedSession.failureReason, /declined/)
  console.log('Phase 5 Stripe smoke test passed: signed success/failure webhooks, signature rejection, idempotent order creation, trusted amount, stock update and cart clearing.')
} finally {
  if (user?._id) { await Promise.all([Order.deleteMany({ user: user._id }), Cart.deleteMany({ user: user._id }), CheckoutSession.deleteMany({ user: user._id })]) }
  if (product?._id) await Product.deleteOne({ _id: product._id }); if (category?._id) await Category.deleteOne({ _id: category._id }); if (user?._id) await User.deleteOne({ _id: user._id })
  if (server) await new Promise((resolve) => server.close(resolve)); await mongoose.disconnect()
}
