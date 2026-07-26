import assert from 'node:assert/strict'
import mongoose from 'mongoose'

process.env.EDW_DISABLE_EMAIL = 'true'
import app from '../app.js'
import { env } from '../config/env.js'
import ContactMessage from '../models/ContactMessage.js'
import NewsletterSubscriber from '../models/NewsletterSubscriber.js'
import Notification from '../models/Notification.js'
import User from '../models/User.js'

const port = 5117
const base = `http://127.0.0.1:${port}/api`
const marker = `communications-${Date.now()}`
const adminEmail = `${marker}-admin@edw.test`
const subscriberEmail = `${marker}-subscriber@example.com`
const password = 'Communications1'
let server
let admin
let contactMessageId

async function request(route, { method = 'GET', cookie, body } = {}) {
  const response = await fetch(`${base}${route}`, {
    method,
    headers: {
      ...(cookie && { Cookie: cookie }),
      ...(body && { 'Content-Type': 'application/json' }),
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  return {
    status: response.status,
    body: await response.json(),
    cookie: response.headers.get('set-cookie')?.split(';')[0],
  }
}

try {
  await mongoose.connect(env.mongoUri)
  admin = await User.create({
    firstName: 'Communications',
    lastName: 'Admin',
    email: adminEmail,
    phone: '0751112299',
    password,
    role: 'admin',
  })
  server = app.listen(port)
  await new Promise((resolve) => server.once('listening', resolve))

  let result = await request('/communications/contact-messages', {
    method: 'POST',
    body: { fullName: 'A', email: 'invalid', phone: '123', subject: '', message: 'Too short' },
  })
  assert.equal(result.status, 422, 'Invalid contact messages must be rejected')

  result = await request('/communications/contact-messages', {
    method: 'POST',
    body: {
      fullName: `Customer ${marker}`,
      email: `${marker}@example.com`,
      phone: '0751234567',
      subject: `Question ${marker}`,
      message: 'I would like to know more about a custom creation for an upcoming celebration.',
    },
  })
  assert.equal(result.status, 201)
  contactMessageId = result.body.data.messageId
  assert.ok(await ContactMessage.exists({ _id: contactMessageId, status: 'Unread' }))

  result = await request('/communications/newsletter-subscriptions', {
    method: 'POST',
    body: { email: subscriberEmail },
  })
  assert.equal(result.status, 201)
  assert.ok(await NewsletterSubscriber.exists({ email: subscriberEmail, isActive: true }))

  result = await request('/communications/newsletter-subscriptions', {
    method: 'POST',
    body: { email: subscriberEmail },
  })
  assert.equal(result.status, 200, 'Duplicate newsletter subscriptions must be idempotent')

  result = await request('/admin/communications/contact-messages')
  assert.equal(result.status, 401, 'Communications data must require administrator authentication')

  result = await request('/auth/login', {
    method: 'POST',
    body: { email: adminEmail, password, rememberMe: false },
  })
  assert.equal(result.status, 200)
  const adminCookie = result.cookie

  result = await request(`/admin/communications/contact-messages?search=${encodeURIComponent(marker)}`, { cookie: adminCookie })
  assert.equal(result.status, 200)
  assert.ok(result.body.data.messages.some((entry) => entry.id === contactMessageId))

  result = await request(`/admin/communications/contact-messages/${contactMessageId}/read`, {
    method: 'PATCH',
    cookie: adminCookie,
  })
  assert.equal(result.status, 200)
  assert.equal(result.body.data.contactMessage.status, 'Read')

  result = await request(`/admin/communications/newsletter-subscribers?search=${encodeURIComponent(marker)}`, { cookie: adminCookie })
  assert.equal(result.status, 200)
  assert.ok(result.body.data.subscribers.some((entry) => entry.email === subscriberEmail))

  result = await request('/admin/dashboard', { cookie: adminCookie })
  assert.equal(result.status, 200)
  assert.ok(result.body.data.communications.summary.contactMessages >= 1)
  assert.ok(result.body.data.communications.summary.activeSubscribers >= 1)

  console.log('Communications smoke test passed: validated submissions, MongoDB persistence, admin protection, message status, subscriber listing, and dashboard summary.')
} finally {
  if (server) await new Promise((resolve) => server.close(resolve))
  await ContactMessage.deleteMany({ $or: [{ _id: contactMessageId }, { fullName: { $regex: marker } }] })
  await NewsletterSubscriber.deleteMany({ email: subscriberEmail })
  await Notification.deleteMany({ message: { $regex: marker } })
  if (admin?._id) await Notification.deleteMany({ recipient: admin._id })
  await User.deleteMany({ email: adminEmail })
  await mongoose.disconnect()
}
