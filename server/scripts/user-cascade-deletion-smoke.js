import assert from 'node:assert/strict'
import mongoose from 'mongoose'

process.env.EDW_DISABLE_EMAIL = 'true'
import app from '../app.js'
import { env } from '../config/env.js'
import Cart from '../models/Cart.js'
import CustomOrder from '../models/CustomOrder.js'
import Notification from '../models/Notification.js'
import Order from '../models/Order.js'
import Review from '../models/Review.js'
import User from '../models/User.js'
import UserDeletionLog from '../models/UserDeletionLog.js'
import Wishlist from '../models/Wishlist.js'

const port = 5114
const base = `http://127.0.0.1:${port}/api`
const suffix = Date.now()
const password = 'CascadeSecure1'
const adminEmail = `cascade-admin-${suffix}@edw.test`
const customerEmail = `cascade-customer-${suffix}@edw.test`
const productId = new mongoose.Types.ObjectId()
const address = { fullName: 'Cascade Customer', phone: '0753334499', addressLine1: '12 Cascade Lane', city: 'Batticaloa', district: 'Batticaloa', province: 'Eastern', country: 'Sri Lanka' }
let server
let admin
let customer

async function request(route, { method = 'GET', cookie, body } = {}) {
  const response = await fetch(`${base}${route}`, { method, headers: { ...(cookie && { Cookie: cookie }), ...(body && { 'Content-Type': 'application/json' }) }, body: body ? JSON.stringify(body) : undefined })
  return { status: response.status, body: await response.json(), cookie: response.headers.get('set-cookie')?.split(';')[0] }
}

try {
  await mongoose.connect(env.mongoUri)
  admin = await User.create({ firstName: 'Cascade', lastName: 'Admin', email: adminEmail, phone: '0751112299', password, role: 'admin' })
  customer = await User.create({ firstName: 'Cascade', lastName: 'Customer', email: customerEmail, phone: '0752223399', password, role: 'user', addresses: [{ label: 'Home', ...address, isDefault: true }] })
  const order = await Order.create({
    orderNumber: `EDW-${new Date().getFullYear()}-${String(suffix).slice(-6)}`, user: customer._id,
    items: [{ product: productId, name: 'Cascade Product', slug: 'cascade-product', size: 'M', image: 'https://example.com/product.webp', price: 2500, quantity: 1 }],
    shippingAddress: address, billingAddress: address, subtotal: 2500, shippingFee: 450, total: 2950,
    paymentMethod: 'COD', paymentStatus: 'Pending', orderStatus: 'Pending', timeline: [{ status: 'Pending', note: 'Cascade test', updatedBy: customer._id }],
  })
  const customOrder = await CustomOrder.create({
    requestNumber: `EDW-CUSTOM-${new Date().getFullYear()}-${String(suffix).slice(-5)}`, user: customer._id,
    occasion: 'Birthday', requiredDate: new Date(Date.now() + 86400000), budgetRange: 'LKR 2,000 - 5,000', preferredColors: 'Pink', giftType: 'Bouquet',
    description: 'A complete custom-order record used to verify cascade deletion.', statusHistory: [{ status: 'Pending', note: 'Cascade test', updatedBy: customer._id }],
  })
  await Review.create({ product: productId, user: customer._id, order: order._id, rating: 5, comment: 'Cascade deletion review record.' })
  await Cart.create({ user: customer._id, items: [{ productId: String(productId), signature: `cascade-${suffix}`, name: 'Cascade Product', slug: 'cascade-product', image: 'https://example.com/product.webp', size: 'M', price: 2500, quantity: 1, category: 'Testing' }], subtotal: 2500 })
  await Wishlist.create({ user: customer._id, items: [{ productId: String(productId), name: 'Cascade Product', slug: 'cascade-product', image: 'https://example.com/product.webp', price: 2500, category: 'Testing' }] })
  await Notification.create([
    { recipient: customer._id, audience: 'customer', type: 'test', title: 'Customer notification', message: 'Must be deleted.', order: order._id },
    { recipient: admin._id, audience: 'admin', type: 'test', title: 'Admin order notification', message: 'Must be deleted with the order.', customOrder: customOrder._id },
  ])

  server = app.listen(port)
  await new Promise((resolve) => server.once('listening', resolve))
  const login = await request('/auth/login', { method: 'POST', body: { email: adminEmail, password, rememberMe: false } })
  assert.equal(login.status, 200)
  const result = await request(`/admin/users/${customer._id}`, { method: 'DELETE', cookie: login.cookie })
  assert.equal(result.status, 200, JSON.stringify(result.body))
  assert.equal(result.body.data.counts.normalOrders, 1)
  assert.equal(result.body.data.counts.customOrders, 1)
  assert.equal(result.body.data.counts.reviews, 1)

  const remaining = await Promise.all([
    User.countDocuments({ _id: customer._id }), Order.countDocuments({ user: customer._id }), CustomOrder.countDocuments({ user: customer._id }),
    Review.countDocuments({ user: customer._id }), Cart.countDocuments({ user: customer._id }), Wishlist.countDocuments({ user: customer._id }),
    Notification.countDocuments({ $or: [{ recipient: customer._id }, { order: order._id }, { customOrder: customOrder._id }] }),
  ])
  assert.deepEqual(remaining, [0, 0, 0, 0, 0, 0, 0], 'Every customer-owned and order-linked record must be deleted')

  const log = await UserDeletionLog.findOne({ 'deletedUser.originalId': String(customer._id) })
  assert.ok(log, 'A permanent deletion audit record must remain')
  assert.equal(log.status, 'Completed')
  assert.equal(log.performedBySnapshot.email, adminEmail)
  assert.equal(log.deletedUser.email, customerEmail)
  assert.deepEqual(log.orderNumbers, [order.orderNumber])
  assert.deepEqual(log.customOrderNumbers, [customOrder.requestNumber])

  const logsResponse = await request(`/admin/user-deletion-logs?search=${encodeURIComponent(customerEmail)}`, { cookie: login.cookie })
  assert.equal(logsResponse.status, 200)
  assert.equal(logsResponse.body.data.logs.length, 1, 'The view-only admin log endpoint returns the deletion')
  console.log('User cascade-deletion smoke test passed: full account/order cleanup, related notification removal, immutable audit snapshot, and protected admin log access.')
} finally {
  if (server) await new Promise((resolve) => server.close(resolve))
  if (customer?._id) await Promise.all([Order.deleteMany({ user: customer._id }), CustomOrder.deleteMany({ user: customer._id }), Review.deleteMany({ user: customer._id }), Cart.deleteMany({ user: customer._id }), Wishlist.deleteMany({ user: customer._id }), Notification.deleteMany({ recipient: customer._id }), UserDeletionLog.deleteMany({ 'deletedUser.originalId': String(customer._id) })])
  await User.deleteMany({ email: { $in: [adminEmail, customerEmail] } })
  await mongoose.disconnect()
}
