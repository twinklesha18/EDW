import assert from 'node:assert/strict'
import mongoose from 'mongoose'

process.env.EDW_DISABLE_EMAIL = 'true'
import app from '../app.js'
import { env } from '../config/env.js'
import Category from '../models/Category.js'
import Order from '../models/Order.js'
import Product from '../models/Product.js'
import Review from '../models/Review.js'
import User from '../models/User.js'

const port = 5109
const base = `http://127.0.0.1:${port}/api`
const suffix = Date.now()
const password = 'ReviewWorkflow1'
const adminEmail = `review-admin-${suffix}@edw.test`
const customerEmail = `review-customer-${suffix}@edw.test`
const address = { fullName: 'Review Customer', phone: '0751234567', addressLine1: '20 Review Lane', city: 'Batticaloa', district: 'Batticaloa', province: 'Eastern', country: 'Sri Lanka' }
let server
let admin
let customer
let category
let product
let pendingOrder
let deliveredOrder
let review

async function request(route, { method = 'GET', cookie, body } = {}) {
  const response = await fetch(`${base}${route}`, { method, headers: { ...(cookie && { Cookie: cookie }), ...(body && { 'Content-Type': 'application/json' }) }, body: body ? JSON.stringify(body) : undefined })
  return { status: response.status, body: await response.json(), cookie: response.headers.get('set-cookie')?.split(';')[0] }
}

async function login(email) {
  const result = await request('/auth/login', { method: 'POST', body: { email, password, rememberMe: false } })
  assert.equal(result.status, 200)
  return result.cookie
}

const orderValues = (orderNumber, orderStatus) => ({
  orderNumber,
  user: customer._id,
  items: [{ product: product._id, name: product.name, slug: product.slug, size: 'M', image: product.image.url, price: 2500, quantity: 1 }],
  shippingAddress: address,
  billingAddress: address,
  subtotal: 2500,
  shippingFee: 450,
  total: 2950,
  paymentMethod: 'COD',
  paymentStatus: orderStatus === 'Delivered' ? 'Paid' : 'Pending',
  orderStatus,
})

try {
  await mongoose.connect(env.mongoUri)
  admin = await User.create({ firstName: 'Review', lastName: 'Admin', email: adminEmail, phone: '0751112233', password, role: 'admin' })
  customer = await User.create({ firstName: 'Review', lastName: 'Customer', email: customerEmail, phone: '0754445566', password, role: 'user' })
  category = await Category.create({ name: `Review ${suffix}`, slug: `review-${suffix}`, description: 'Review verification category' })
  product = await Product.create({ name: 'Delivered Review Product', slug: `delivered-review-${suffix}`, category: category._id, description: 'Product used to verify delivered-order reviews.', prices: { S: 2000, M: 2500, L: 3000 }, image: { url: 'https://example.com/review-product.webp', alt: 'Review product' } })
  pendingOrder = await Order.create(orderValues('EDW-2099-900001', 'Confirmed'))
  deliveredOrder = await Order.create(orderValues('EDW-2099-900002', 'Delivered'))
  server = app.listen(port)
  await new Promise((resolve) => server.once('listening', resolve))
  const customerCookie = await login(customerEmail)
  const adminCookie = await login(adminEmail)

  let result = await request('/reviews', { method: 'POST', cookie: customerCookie, body: { orderNumber: pendingOrder.orderNumber, productId: product._id, rating: 5, title: 'Too early', comment: 'This must be rejected before delivery.' } })
  assert.equal(result.status, 409, 'Reviews must be blocked until delivery')

  result = await request('/reviews', { method: 'POST', cookie: customerCookie, body: { orderNumber: deliveredOrder.orderNumber, productId: product._id, rating: 5, title: 'Beautiful delivery', comment: 'The finished creation was elegant and beautifully presented.' } })
  assert.equal(result.status, 201)
  review = result.body.data.review
  assert.equal(review.isApproved, false, 'New reviews must wait for administrator approval')

  result = await request('/reviews/homepage')
  assert.equal(result.status, 200)
  assert.ok(!result.body.data.reviews.some((entry) => entry.id === review.id), 'Pending reviews must not appear on the homepage')
  result = await request('/admin/reviews?status=pending', { cookie: adminCookie })
  assert.ok(result.body.data.reviews.some((entry) => entry.id === review.id), 'Pending review must appear in the admin dashboard')
  result = await request(`/admin/reviews/${review.id}/moderate`, { method: 'PATCH', cookie: customerCookie, body: { isApproved: true } })
  assert.equal(result.status, 403, 'Customers cannot approve reviews')
  result = await request(`/admin/reviews/${review.id}/moderate`, { method: 'PATCH', cookie: adminCookie, body: { isApproved: true } })
  assert.equal(result.status, 200)
  assert.equal(result.body.data.review.isApproved, true)

  result = await request('/reviews/homepage')
  assert.ok(result.body.data.reviews.some((entry) => entry.id === review.id), 'Approved review must appear in the homepage feed')
  result = await request(`/orders/${deliveredOrder.orderNumber}`, { cookie: customerCookie })
  assert.ok(result.body.data.order.customerReviews.some((entry) => String(entry.product) === String(product._id)), 'Customer dashboard must show the submitted review and approval state')
  result = await request('/reviews', { method: 'POST', cookie: customerCookie, body: { orderNumber: deliveredOrder.orderNumber, productId: product._id, rating: 4, title: 'Duplicate', comment: 'A duplicate review must not be accepted.' } })
  assert.equal(result.status, 409)

  console.log('Review workflow smoke test passed: delivered-only submission, pending moderation, admin approval, dashboard status, and homepage publication.')
} finally {
  if (server) await new Promise((resolve) => server.close(resolve))
  if (review?._id || review?.id) await Review.deleteOne({ _id: review._id || review.id })
  if (pendingOrder?._id) await Order.deleteOne({ _id: pendingOrder._id })
  if (deliveredOrder?._id) await Order.deleteOne({ _id: deliveredOrder._id })
  if (product?._id) await Product.deleteOne({ _id: product._id })
  if (category?._id) await Category.deleteOne({ _id: category._id })
  await User.deleteMany({ email: { $in: [adminEmail, customerEmail] } })
  await mongoose.disconnect()
}
