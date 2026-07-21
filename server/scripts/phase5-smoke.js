import assert from 'node:assert/strict'
import mongoose from 'mongoose'
import app from '../app.js'
import { env } from '../config/env.js'
import Cart from '../models/Cart.js'
import Category from '../models/Category.js'
import CheckoutSession from '../models/CheckoutSession.js'
import Coupon from '../models/Coupon.js'
import Order from '../models/Order.js'
import Product from '../models/Product.js'
import User from '../models/User.js'
import { orderConfirmationEmail, orderStatusEmail, passwordResetEmail, paymentFailedEmail, paymentSuccessEmail, welcomeEmail } from '../services/emailTemplates.js'

const port = 5102, base = `http://127.0.0.1:${port}/api`, suffix = Date.now()
const userEmail = `phase5-user-${suffix}@example.com`, adminEmail = `phase5-admin-${suffix}@example.com`
let server, user, admin, category, product, coupon, firstOrder, secondOrder, userCookie = '', adminCookie = ''
const address = { fullName: 'Phase Five Customer', phone: '0760894222', addressLine1: '25 Dream Lane', addressLine2: '', city: 'Batticaloa', district: 'Batticaloa', province: 'Eastern', postalCode: '30000', country: 'Sri Lanka' }
const checkout = (overrides = {}) => ({ shippingAddress: address, billingAddress: address, billingSameAsShipping: true, shippingMethod: 'standard', couponCode: '', ...overrides })
async function request(path, { method = 'GET', body, cookie = userCookie, raw = false } = {}) {
  const response = await fetch(`${base}${path}`, { method, headers: { ...(body ? { 'Content-Type': 'application/json' } : {}), ...(cookie ? { Cookie: cookie } : {}) }, body: body ? JSON.stringify(body) : undefined })
  const setCookie = response.headers.get('set-cookie')
  const result = { status: response.status, headers: response.headers, body: raw ? await response.arrayBuffer() : await response.json() }
  if (setCookie) result.cookie = setCookie.split(';')[0]
  return result
}
const seedCart = async (quantity) => Cart.findOneAndUpdate({ user: user._id }, { $set: { items: [{ productId: String(product._id), signature: `${product._id}:phase5`, name: product.name, slug: product.slug, image: product.thumbnail.url, price: 1, quantity, stock: 999, category: category.name, customization: { message: 'Happy Birthday', preferredColor: 'Pink', notes: 'Ribbon' } }], subtotal: 1 } }, { upsert: true, returnDocument: 'after' })

try {
  await mongoose.connect(env.mongoUri); server = app.listen(port); await new Promise((resolve) => server.once('listening', resolve))
  user = await User.create({ firstName: 'Phase', lastName: 'Customer', email: userEmail, phone: '0760894222', password: 'SecureUser1', role: 'user' })
  admin = await User.create({ firstName: 'Phase', lastName: 'Admin', email: adminEmail, phone: '0771234567', password: 'SecureAdmin1', role: 'admin' })
  category = await Category.create({ name: `Phase Five ${suffix}`, slug: `phase-five-${suffix}`, description: 'Phase 5 checkout test category', isActive: true })
  product = await Product.create({ name: 'Phase Five Celebration Box', slug: `phase-five-box-${suffix}`, description: 'A production checkout verification product with trusted server-side pricing.', shortDescription: 'Checkout verification gift box.', price: 10000, discountPrice: 9500, costPrice: 5000, sku: `EDW-P5-${suffix}`, category: category._id, thumbnail: { url: 'https://example.com/phase5.webp', publicId: '', alt: 'Gift box' }, stock: 10, sold: 0, isActive: true })
  coupon = await Coupon.create({ code: `P5${suffix}`, discountType: 'percentage', discountValue: 10, minimumAmount: 5000, maximumDiscount: 800, expiryDate: new Date(Date.now() + 86400000), usageLimit: 5, isActive: true })
  await seedCart(2)

  let result = await request('/auth/login', { method: 'POST', body: { email: userEmail, password: 'SecureUser1', rememberMe: false }, cookie: '' }); assert.equal(result.status, 200); userCookie = result.cookie
  result = await request('/auth/login', { method: 'POST', body: { email: adminEmail, password: 'SecureAdmin1', rememberMe: false }, cookie: '' }); assert.equal(result.status, 200); adminCookie = result.cookie
  result = await request('/checkout/quote', { method: 'POST', body: checkout({ shippingAddress: { ...address, phone: 'invalid' } }) }); assert.equal(result.status, 422, 'Invalid Sri Lankan phone must fail')
  result = await request('/checkout/quote', { method: 'POST', body: checkout({ couponCode: coupon.code, subtotal: -1000, total: 1 }) }); assert.equal(result.status, 200); assert.equal(result.body.data.quote.subtotal, 19000, 'Frontend price fields must be ignored'); assert.equal(result.body.data.quote.discount, 800); assert.equal(result.body.data.quote.shippingFee, 450); assert.equal(result.body.data.quote.total, 18650)
  result = await request('/checkout/cod', { method: 'POST', body: checkout({ couponCode: coupon.code }) }); assert.equal(result.status, 201); firstOrder = result.body.data.order
  assert.match(firstOrder.orderNumber, /^EDW-\d{4}-\d{6}$/); assert.equal(firstOrder.paymentMethod, 'COD'); assert.equal(firstOrder.paymentStatus, 'Pending'); assert.equal(firstOrder.timeline[0].status, 'Pending')
  product = await Product.findById(product._id); assert.equal(product.stock, 8); assert.equal(product.sold, 2)
  let cart = await Cart.findOne({ user: user._id }); assert.equal(cart.items.length, 0, 'Cart must clear after order')
  coupon = await Coupon.findById(coupon._id); assert.equal(coupon.usedCount, 1); assert.equal(coupon.redemptions.length, 1)

  await seedCart(1)
  result = await request('/checkout/quote', { method: 'POST', body: checkout({ couponCode: coupon.code }) }); assert.equal(result.status, 422, 'Coupon must be single use per customer')
  result = await request('/checkout/cod', { method: 'POST', body: checkout() }); assert.equal(result.status, 201); secondOrder = result.body.data.order
  result = await request(`/orders/${secondOrder.orderNumber}/cancel`, { method: 'POST' }); assert.equal(result.status, 200); assert.equal(result.body.data.order.orderStatus, 'Cancelled')
  product = await Product.findById(product._id); assert.equal(product.stock, 8, 'Cancellation must restore stock'); assert.equal(product.sold, 2, 'Cancellation must restore sold count')
  result = await request(`/orders/${secondOrder.orderNumber}/cancel`, { method: 'POST' }); assert.equal(result.status, 409, 'Duplicate cancellation must fail')
  result = await request(`/orders/${firstOrder.orderNumber}/reorder`, { method: 'POST' }); assert.equal(result.status, 200); cart = await Cart.findOne({ user: user._id }); assert.equal(cart.items.length, 1)

  result = await request('/orders/track', { method: 'POST', body: { orderNumber: firstOrder.orderNumber, email: 'wrong@example.com' }, cookie: '' }); assert.equal(result.status, 404)
  result = await request('/orders/track', { method: 'POST', body: { orderNumber: firstOrder.orderNumber, email: userEmail }, cookie: '' }); assert.equal(result.status, 200); assert.equal(result.body.data.order.orderStatus, 'Pending')
  result = await request(`/orders/${firstOrder.orderNumber}`); assert.equal(result.status, 200); assert.equal(result.body.data.order.items[0].price, 9500)
  result = await request('/orders?status=Pending'); assert.equal(result.status, 200); assert.ok(result.body.data.orders.some((order) => order.orderNumber === firstOrder.orderNumber))
  result = await request(`/orders/${firstOrder.orderNumber}/invoice`, { raw: true }); assert.equal(result.status, 200); assert.match(result.headers.get('content-type'), /application\/pdf/); assert.ok(result.body.byteLength > 1000)

  result = await request(`/admin/orders/${firstOrder.id}`, { method: 'PUT', cookie: adminCookie, body: { orderStatus: 'Shipped', paymentStatus: 'Pending', trackingNumber: '', notes: 'Dispatched by Phase 5 test' } }); assert.equal(result.status, 200); assert.match(result.body.data.order.trackingNumber, /^EDW-TRK-/); assert.ok(result.body.data.order.timeline.some((event) => event.status === 'Shipped'))
  result = await request(`/admin/orders/${firstOrder.id}`, { method: 'PUT', cookie: adminCookie, body: { orderStatus: 'Delivered', paymentStatus: 'Pending', trackingNumber: result.body.data.order.trackingNumber, notes: 'Delivered by Phase 5 test' } }); assert.equal(result.status, 200); assert.equal(result.body.data.order.paymentStatus, 'Paid', 'Delivered COD must become paid')
  result = await request(`/admin/orders/${firstOrder.id}/invoice`, { cookie: adminCookie, raw: true }); assert.equal(result.status, 200); assert.ok(result.body.byteLength > 1000)
  result = await request('/checkout/quote', { method: 'POST', body: checkout(), cookie: adminCookie }); assert.equal(result.status, 400, 'Admin without a cart cannot quote')

  const templates = [welcomeEmail(user, 'http://localhost:5173'), passwordResetEmail(user, 'http://localhost:5173/reset'), orderConfirmationEmail(user, firstOrder, 'http://localhost:5173'), paymentSuccessEmail(user, firstOrder, 'http://localhost:5173'), paymentFailedEmail(user, 'http://localhost:5173'), orderStatusEmail(user, { ...firstOrder, orderStatus: 'Shipped' }, 'http://localhost:5173')]
  assert.ok(templates.every((template) => template.subject && template.html.includes('Eshaz Dream World')), 'Every email template must be complete HTML')
  console.log('Phase 5 smoke test passed: trusted checkout totals, COD, coupon rules, stock/sold updates, cart clearing, tracking, cancellation rollback, reorder, invoices, admin timeline/tracking and email templates.')
} finally {
  await CheckoutSession.deleteMany({ user: { $in: [user?._id, admin?._id].filter(Boolean) } })
  await Order.deleteMany({ user: user?._id })
  await Cart.deleteMany({ user: { $in: [user?._id, admin?._id].filter(Boolean) } })
  if (coupon?._id) await Coupon.deleteOne({ _id: coupon._id })
  if (product?._id) await Product.deleteOne({ _id: product._id })
  if (category?._id) await Category.deleteOne({ _id: category._id })
  await User.deleteMany({ email: { $in: [userEmail, adminEmail] } })
  if (server) await new Promise((resolve) => server.close(resolve)); await mongoose.disconnect()
}
