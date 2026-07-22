import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import mongoose from 'mongoose'
import app from '../app.js'
import { env } from '../config/env.js'
import Cart from '../models/Cart.js'
import Category from '../models/Category.js'
import Counter from '../models/Counter.js'
import Order from '../models/Order.js'
import Notification from '../models/Notification.js'
import Product from '../models/Product.js'
import User from '../models/User.js'
import { getResolvedSiteSettings } from '../services/siteSettingsService.js'
import { createCartSignature } from '../utils/cartUtils.js'
import { deleteImage } from '../utils/cloudinaryUtils.js'

process.env.EDW_DISABLE_EMAIL = 'true'

process.env.BANK_NAME = 'EDW Verification Bank'
process.env.BANK_ACCOUNT_NAME = 'Eshaz Dream World Verification'
process.env.BANK_ACCOUNT_NUMBER = '0000000000'
process.env.BANK_BRANCH = 'Verification Branch'
process.env.BANK_BRANCH_CODE = '000'

const port = 5106
const base = `http://127.0.0.1:${port}/api`
const suffix = Date.now()
const password = 'BankTransferSecure1'
const customerEmail = `bank-customer-${suffix}@edw.test`
const adminEmail = `bank-admin-${suffix}@edw.test`
const currentDirectory = path.dirname(fileURLToPath(import.meta.url))
const imagePath = path.resolve(currentDirectory, '..', '..', 'client', 'src', 'assets', 'images', 'products', 'chocolate-bouquet.jpg')
const counterId = `orders-${new Date().getFullYear()}`
const address = { fullName: 'Bank Transfer Customer', phone: '0751234567', addressLine1: '25 Payment Lane', addressLine2: '', city: 'Batticaloa', district: 'Batticaloa', province: 'Eastern', postalCode: '30000', country: 'Sri Lanka' }
const checkout = { shippingAddress: address, billingAddress: address, billingSameAsShipping: true, shippingMethod: 'standard' }

let server
let customer
let admin
let category
let product
let createdOrder
let originalCounterSequence = null
let testCounterSequence = null
let expectedSettings

async function login(email) {
  const response = await fetch(`${base}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password, rememberMe: false }) })
  assert.equal(response.status, 200, `Login failed for ${email}`)
  return response.headers.get('set-cookie').split(';')[0]
}

async function jsonRequest(route, { method = 'GET', cookie, body } = {}) {
  const response = await fetch(`${base}${route}`, { method, headers: { ...(cookie && { Cookie: cookie }), ...(body && { 'Content-Type': 'application/json' }) }, body: body ? JSON.stringify(body) : undefined })
  return { status: response.status, body: await response.json() }
}

function paymentForm(imageBuffer, reference) {
  const form = new FormData()
  form.set('checkout', JSON.stringify(checkout))
  form.set('paymentReference', reference)
  form.set('paymentSlip', new Blob([imageBuffer], { type: 'image/jpeg' }), 'payment-slip.jpg')
  return form
}

try {
  await mongoose.connect(env.mongoUri)
  expectedSettings = await getResolvedSiteSettings()
  originalCounterSequence = (await Counter.findById(counterId).lean())?.sequence ?? null
  customer = await User.create({ firstName: 'Bank', lastName: 'Customer', email: customerEmail, phone: '0751234567', password, role: 'user' })
  admin = await User.create({ firstName: 'Bank', lastName: 'Admin', email: adminEmail, phone: '0757654321', password, role: 'admin' })
  category = await Category.create({ name: `Bank Transfer ${suffix}`, slug: `bank-transfer-${suffix}`, description: 'Normal bank transfer verification category' })
  product = await Product.create({ name: 'Verification Bouquet', slug: `verification-bouquet-${suffix}`, category: category._id, description: 'A product used to verify secure manual bank payment checkout.', prices: { S: 2500, M: 3500, L: 4500 }, image: { url: 'https://example.com/verification.webp', publicId: '', alt: 'Verification bouquet' } })
  await Cart.create({ user: customer._id, items: [{ productId: String(product._id), signature: createCartSignature(String(product._id), 'M'), name: product.name, slug: product.slug, image: product.image.url, size: 'M', price: 1, quantity: 1, category: category.name }], subtotal: 1 })

  server = app.listen(port)
  await new Promise((resolve) => server.once('listening', resolve))
  const imageBuffer = await readFile(imagePath)
  const customerCookie = await login(customerEmail)
  const adminCookie = await login(adminEmail)

  let result = await jsonRequest('/checkout/payment-config', { cookie: customerCookie })
  assert.equal(result.status, 200)
  assert.deepEqual(result.body.data.methods, ['COD', 'Bank Transfer'])
  assert.equal(result.body.data.bankTransfer.accountNumber, expectedSettings.bank.accountNumber)

  let response = await fetch(`${base}/checkout/bank-transfer`, { method: 'POST', headers: { Cookie: customerCookie }, body: paymentForm(imageBuffer, 'BANK-TEST-001') })
  let responseBody = await response.json()
  assert.equal(response.status, 201, `Bank-transfer checkout failed: ${JSON.stringify(responseBody)}`)
  createdOrder = responseBody.data.order
  testCounterSequence = Number(createdOrder.orderNumber.split('-').at(-1))
  assert.equal(createdOrder.paymentMethod, 'Bank Transfer')
  assert.equal(createdOrder.paymentStatus, 'Slip Submitted')
  assert.equal(createdOrder.payment.reference, 'BANK-TEST-001')
  assert.ok(createdOrder.payment.slip.url)
  assert.equal(createdOrder.total, 3500 + expectedSettings.shipping.standardFee, 'Server pricing plus the managed standard shipping fee must be trusted')

  response = await fetch(`${base}/orders/${createdOrder.orderNumber}/invoice`, { headers: { Cookie: customerCookie } })
  responseBody = await response.json()
  assert.equal(response.status, 409, 'Customer invoice must be unavailable before delivery')
  assert.match(responseBody.message, /after the order is delivered/i)

  result = await jsonRequest(`/admin/orders/${createdOrder._id}`, { cookie: adminCookie })
  assert.equal(result.status, 200)
  assert.ok(result.body.data.order.payment.slip.url, 'Administrator must see the uploaded payment slip')
  response = await fetch(`${base}/admin/orders/${createdOrder._id}/invoice`, { headers: { Cookie: adminCookie } })
  assert.equal(response.status, 200, 'Administrator invoice access must remain available before delivery')
  assert.match(response.headers.get('content-type') || '', /application\/pdf/)
  await response.arrayBuffer()

  result = await jsonRequest(`/admin/orders/${createdOrder._id}/payment`, { method: 'PUT', cookie: adminCookie, body: { action: 'reject', note: 'The transfer amount is not readable.' } })
  assert.equal(result.status, 200)
  assert.equal(result.body.data.order.paymentStatus, 'Payment Rejected')

  result = await jsonRequest(`/orders/${createdOrder.orderNumber}`, { cookie: customerCookie })
  assert.equal(result.status, 200)
  assert.equal(result.body.data.order.payment.reviewNote, 'The transfer amount is not readable.')

  const replacement = new FormData()
  replacement.set('paymentReference', 'BANK-TEST-002')
  replacement.set('paymentSlip', new Blob([imageBuffer], { type: 'image/jpeg' }), 'replacement-slip.jpg')
  response = await fetch(`${base}/orders/${createdOrder.orderNumber}/payment-slip`, { method: 'POST', headers: { Cookie: customerCookie }, body: replacement })
  responseBody = await response.json()
  assert.equal(response.status, 200, `Slip resubmission failed: ${JSON.stringify(responseBody)}`)
  assert.equal(responseBody.data.order.paymentStatus, 'Slip Submitted')
  assert.equal(responseBody.data.order.payment.reference, 'BANK-TEST-002')

  result = await jsonRequest(`/admin/orders/${createdOrder._id}/payment`, { method: 'PUT', cookie: adminCookie, body: { action: 'approve', note: 'Transfer verified.' } })
  assert.equal(result.status, 200)
  assert.equal(result.body.data.order.paymentStatus, 'Paid')

  result = await jsonRequest(`/admin/orders/${createdOrder._id}`, { method: 'PUT', cookie: adminCookie, body: { orderStatus: 'Confirmed', trackingNumber: '', notes: 'Payment confirmed and order accepted.' } })
  assert.equal(result.status, 200)
  assert.equal(result.body.data.order.orderStatus, 'Confirmed')

  result = await jsonRequest(`/orders/${createdOrder.orderNumber}`, { cookie: customerCookie })
  assert.equal(result.status, 200)
  assert.equal(result.body.data.order.paymentStatus, 'Paid')
  assert.equal(result.body.data.order.orderStatus, 'Confirmed')

  result = await jsonRequest(`/admin/orders/${createdOrder._id}`, { method: 'PUT', cookie: adminCookie, body: { orderStatus: 'Delivered', trackingNumber: '', notes: 'Order delivered to the customer.' } })
  assert.equal(result.status, 200)
  assert.equal(result.body.data.order.orderStatus, 'Delivered')
  response = await fetch(`${base}/orders/${createdOrder.orderNumber}/invoice`, { headers: { Cookie: customerCookie } })
  assert.equal(response.status, 200, 'Customer invoice must become available after delivery')
  assert.match(response.headers.get('content-type') || '', /application\/pdf/)
  await response.arrayBuffer()

  await Cart.updateOne({ user: customer._id }, { $set: { items: [{ productId: String(product._id), signature: createCartSignature(String(product._id), 'S'), name: product.name, slug: product.slug, image: product.image.url, size: 'S', price: product.prices.S, quantity: 1, category: category.name }], subtotal: product.prices.S } })
  result = await jsonRequest('/checkout/cod', { method: 'POST', cookie: customerCookie, body: checkout })
  assert.equal(result.status, 201)
  const codOrder = result.body.data.order
  assert.equal(codOrder.paymentMethod, 'COD')
  assert.equal(codOrder.paymentStatus, 'Pending')
  testCounterSequence = Number(codOrder.orderNumber.split('-').at(-1))

  result = await jsonRequest(`/orders/${codOrder.orderNumber}/cancel`, { method: 'POST', cookie: customerCookie, body: { reason: 'short' } })
  assert.equal(result.status, 422, 'A short cancellation reason must be rejected')
  result = await jsonRequest(`/orders/${codOrder.orderNumber}/cancel`, { method: 'POST', cookie: customerCookie, body: { reason: 'I accidentally selected the wrong product size.' } })
  assert.equal(result.status, 200)
  assert.equal(result.body.data.order.orderStatus, 'Cancelled')
  assert.equal(result.body.data.order.cancellation.reason, 'I accidentally selected the wrong product size.')
  assert.equal(result.body.data.order.cancellation.cancelledByRole, 'customer')

  result = await jsonRequest(`/admin/orders/cancellations?search=${codOrder.orderNumber}`, { cookie: adminCookie })
  assert.equal(result.status, 200)
  assert.equal(result.body.data.orders.length, 1)
  assert.equal(result.body.data.orders[0].items[0].name, product.name)
  assert.equal(result.body.data.orders[0].user.email, customerEmail)

  result = await jsonRequest(`/orders/${codOrder.orderNumber}/invoice`, { cookie: customerCookie })
  assert.equal(result.status, 409, 'Customer invoice must be unavailable for a cancelled order')
  result = await jsonRequest(`/admin/orders/${codOrder._id}/invoice`, { cookie: adminCookie })
  assert.equal(result.status, 409, 'Admin invoice must be unavailable for a cancelled order')
  console.log('Phase 5 payment smoke test passed: COD, bank transfer, slip review, delivered-only customer invoices, admin invoices, and cancellation reporting.')
} finally {
  if (server) await new Promise((resolve) => server.close(resolve))
  const orders = customer?._id ? await Order.find({ user: customer._id }).select('payment.slip.publicId') : []
  await Promise.all(orders.map((order) => order.payment?.slip?.publicId).filter(Boolean).map((publicId) => deleteImage(publicId).catch(() => {})))
  await Notification.deleteMany({ $or: [{ recipient: { $in: [customer?._id, admin?._id].filter(Boolean) } }, { order: { $in: orders.map((order) => order._id) } }] })
  if (customer?._id) await Order.deleteMany({ user: customer._id })
  if (customer?._id) await Cart.deleteMany({ user: customer._id })
  if (product?._id) await Product.deleteOne({ _id: product._id })
  if (category?._id) await Category.deleteOne({ _id: category._id })
  await User.deleteMany({ email: { $in: [customerEmail, adminEmail] } })
  const currentCounter = await Counter.findById(counterId).lean()
  if (testCounterSequence && currentCounter?.sequence === testCounterSequence) {
    if (originalCounterSequence === null) await Counter.deleteOne({ _id: counterId })
    else await Counter.updateOne({ _id: counterId }, { sequence: originalCounterSequence })
  }
  await mongoose.disconnect()
}
