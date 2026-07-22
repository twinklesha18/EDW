import assert from 'node:assert/strict'
import mongoose from 'mongoose'

process.env.EDW_DISABLE_EMAIL = 'true'
import app from '../app.js'
import { env } from '../config/env.js'
import Notification from '../models/Notification.js'
import User from '../models/User.js'
import { notifyNormalOrderAdminEvent, notifyNormalOrderPlaced, notifyNormalOrderStatus, notifyNormalOrderTracking } from '../services/orderNotificationService.js'

const port = 5112
const base = `http://127.0.0.1:${port}/api`
const suffix = Date.now()
const password = 'NotifySecure1'
const adminEmail = `notify-admin-${suffix}@edw.test`
const customerEmail = `notify-customer-${suffix}@edw.test`
let server
let admin
let customer
let testOrderId

async function request(route, { method = 'GET', cookie, body } = {}) {
  const response = await fetch(`${base}${route}`, {
    method,
    headers: { ...(cookie && { Cookie: cookie }), ...(body && { 'Content-Type': 'application/json' }) },
    body: body ? JSON.stringify(body) : undefined,
  })
  return { status: response.status, body: await response.json(), cookie: response.headers.get('set-cookie')?.split(';')[0] }
}

async function login(email) {
  return request('/auth/login', { method: 'POST', body: { email, password, rememberMe: false } })
}

try {
  await mongoose.connect(env.mongoUri)
  admin = await User.create({ firstName: 'Notify', lastName: 'Admin', email: adminEmail, phone: '0751117788', password, role: 'admin' })
  customer = await User.create({ firstName: 'Notify', lastName: 'Customer', email: customerEmail, phone: '0752228899', password, role: 'user' })
  server = app.listen(port)
  await new Promise((resolve) => server.once('listening', resolve))
  const adminCookie = (await login(adminEmail)).cookie
  const customerCookie = (await login(customerEmail)).cookie
  testOrderId = new mongoose.Types.ObjectId()
  const order = { _id: testOrderId, orderNumber: `EDW-${new Date().getFullYear()}-${String(suffix).slice(-6)}`, orderStatus: 'Pending', paymentStatus: 'Pending', paymentMethod: 'COD', total: 2500 }

  await notifyNormalOrderPlaced(order, customer)
  let result = await request('/notifications', { cookie: adminCookie })
  assert.equal(result.status, 200)
  const adminOrderNotification = result.body.data.notifications.find((entry) => entry.title === `New order ${order.orderNumber}`)
  assert.ok(adminOrderNotification, 'Administrator receives an unread new-order notification')
  const adminNotificationId = adminOrderNotification.id

  result = await request('/notifications', { cookie: customerCookie })
  assert.equal(result.status, 200)
  assert.equal(result.body.data.unreadCount, 1, 'Customer receives an unread order confirmation notification')
  assert.match(result.body.data.notifications[0].title, /placed/)
  const customerNotificationId = result.body.data.notifications[0].id

  result = await request(`/notifications/${adminNotificationId}/read`, { method: 'PATCH', cookie: customerCookie })
  assert.equal(result.status, 404, 'A customer cannot access another recipient\'s notification')
  result = await request(`/notifications/${customerNotificationId}/read`, { method: 'PATCH', cookie: customerCookie })
  assert.equal(result.status, 200)
  assert.ok(result.body.data.notification.readAt)

  order.orderStatus = 'Delivered'
  const partiallyPopulatedCustomer = await User.findById(customer._id).select('firstName email')
  await notifyNormalOrderStatus(order, partiallyPopulatedCustomer)
  result = await request('/notifications', { cookie: customerCookie })
  assert.equal(result.body.data.unreadCount, 1)
  assert.match(result.body.data.notifications[0].title, /delivered/)
  result = await request('/notifications/read-all', { method: 'PATCH', cookie: customerCookie })
  assert.equal(result.status, 200)
  result = await request('/notifications', { cookie: customerCookie })
  assert.equal(result.body.data.unreadCount, 0)

  order.trackingNumber = `TRACK-${String(suffix).slice(-6)}`
  await notifyNormalOrderTracking(order, customer)
  result = await request('/notifications', { cookie: customerCookie })
  assert.match(result.body.data.notifications[0].title, /Tracking updated/)

  order.orderStatus = 'Cancelled'
  await Promise.all([
    notifyNormalOrderStatus(order, customer),
    notifyNormalOrderAdminEvent(order, `Order ${order.orderNumber} cancelled`, `${customer.firstName} cancelled the order during notification testing.`),
  ])
  result = await request('/notifications', { cookie: customerCookie })
  assert.match(result.body.data.notifications[0].title, /Cancelled/)
  result = await request('/notifications', { cookie: adminCookie })
  assert.ok(result.body.data.notifications.some((entry) => entry.title === `Order ${order.orderNumber} cancelled`))

  console.log('Notification smoke test passed: placement, delivery, tracking, cancellation, admin/customer delivery, isolation, and read state.')
} finally {
  if (server) await new Promise((resolve) => server.close(resolve))
  if (admin || customer || testOrderId) await Notification.deleteMany({ $or: [{ recipient: { $in: [admin?._id, customer?._id].filter(Boolean) } }, ...(testOrderId ? [{ order: testOrderId }] : [])] })
  await User.deleteMany({ email: { $in: [adminEmail, customerEmail] } })
  await mongoose.disconnect()
}
