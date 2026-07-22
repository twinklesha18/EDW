import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import dotenv from 'dotenv'
import mongoose from 'mongoose'

process.env.EDW_DISABLE_EMAIL = 'true'
import app from '../app.js'
import Counter from '../models/Counter.js'
import CustomOrder from '../models/CustomOrder.js'
import Notification from '../models/Notification.js'
import User from '../models/User.js'
import { deleteImage } from '../utils/cloudinaryUtils.js'

dotenv.config()
process.env.BANK_NAME = 'EDW Verification Bank'
process.env.BANK_ACCOUNT_NAME = 'Eshaz Dream World Test'
process.env.BANK_ACCOUNT_NUMBER = '0000000000'
process.env.BANK_BRANCH = 'Verification Branch'
process.env.BANK_BRANCH_CODE = '000'

const currentDirectory = path.dirname(fileURLToPath(import.meta.url))
const imagePath = path.resolve(currentDirectory, '..', '..', 'client', 'src', 'assets', 'images', 'products', 'chocolate-bouquet.jpg')
const suffix = Date.now()
const customerEmail = `custom-order-customer-${suffix}@edw.test`
const adminEmail = `custom-order-admin-${suffix}@edw.test`
const password = 'CustomOrderSecure1'
let server
let customerId
let adminId
let customOrderId
let codOrderId
let uploadedPublicId
const counterId = `custom-orders-${new Date().getFullYear()}`
let originalCounterSequence = null
let testCounterSequence = null

function createForm(imageBuffer) {
  const form = new FormData()
  form.set('occasion', 'Birthday')
  form.set('requiredDate', new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10))
  form.set('budgetRange', 'LKR 5,000 - 10,000')
  form.set('preferredColors', 'Pastel pink and gold')
  form.set('giftType', 'Bouquet')
  form.set('bouquetType', 'Chocolate')
  form.set('specialMessage', 'Wishing you a wonderful birthday')
  form.set('description', 'Please create an elegant pastel arrangement with a balanced chocolate selection.')
  form.set('agreement', 'true')
  if (imageBuffer) form.set('inspiration', new Blob([imageBuffer], { type: 'image/jpeg' }), 'inspiration.jpg')
  return form
}

async function login(email) {
  const response = await fetch('http://127.0.0.1:5105/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, rememberMe: false }),
  })
  assert.equal(response.status, 200, `Login failed for ${email}`)
  return response.headers.get('set-cookie').split(';')[0]
}

async function jsonRequest(route, { method = 'GET', cookie, body } = {}) {
  const response = await fetch(`http://127.0.0.1:5105/api${route}`, {
    method,
    headers: { ...(cookie && { Cookie: cookie }), ...(body && { 'Content-Type': 'application/json' }) },
    body: body ? JSON.stringify(body) : undefined,
  })
  return { status: response.status, body: await response.json() }
}

try {
  assert.ok(process.env.MONGODB_URI, 'MONGODB_URI is required for the custom-order smoke test')
  await mongoose.connect(process.env.MONGODB_URI)
  originalCounterSequence = (await Counter.findById(counterId).lean())?.sequence ?? null
  const customer = await User.create({ firstName: 'Custom', lastName: 'Customer', email: customerEmail, phone: '0771234567', password, role: 'user', addresses: [{ label: 'Home', fullName: 'Custom Customer', phone: '0771234567', addressLine1: '25 Verification Lane', city: 'Batticaloa', district: 'Batticaloa', province: 'Eastern', country: 'Sri Lanka', isDefault: true }] })
  customerId = customer._id
  const addressId = String(customer.addresses[0]._id)
  const admin = await User.create({ firstName: 'Custom', lastName: 'Admin', email: adminEmail, phone: '0777654321', password, role: 'admin' })
  adminId = admin._id

  server = app.listen(5105)
  await new Promise((resolve) => server.once('listening', resolve))
  const imageBuffer = await readFile(imagePath)

  let response = await fetch('http://127.0.0.1:5105/api/custom-orders', { method: 'POST', body: createForm() })
  assert.equal(response.status, 401, 'A logged-out customer must not be allowed to submit a custom order')
  await response.json()

  const customerCookie = await login(customerEmail)
  response = await fetch('http://127.0.0.1:5105/api/custom-orders', {
    method: 'POST',
    headers: { Cookie: customerCookie },
    body: createForm(imageBuffer),
  })
  const createdBody = await response.json()
  assert.equal(response.status, 201, `Customer submission failed: ${JSON.stringify(createdBody)}`)
  const created = createdBody.data.customOrder
  customOrderId = created._id
  uploadedPublicId = created.inspiration.publicId
  testCounterSequence = Number(created.requestNumber.split('-').at(-1))
  assert.match(created.requestNumber, /^EDW-CUSTOM-\d{4}-\d{5}$/)
  assert.equal(created.status, 'Pending')
  assert.equal(String(created.user._id), String(customerId))
  assert.ok(created.inspiration.url, 'Uploaded inspiration image URL is required')

  let result = await jsonRequest('/custom-orders', { cookie: customerCookie })
  assert.equal(result.status, 200)
  assert.equal(result.body.data.customOrders.length, 1, 'The customer dashboard must show the submitted custom order')
  assert.equal(result.body.data.customOrders[0].requestNumber, created.requestNumber)

  const adminCookie = await login(adminEmail)
  result = await jsonRequest(`/admin/custom-orders?search=${encodeURIComponent(created.requestNumber)}`, { cookie: adminCookie })
  assert.equal(result.status, 200)
  assert.equal(result.body.data.customOrders.length, 1, 'Admin custom-order list must contain the submitted request')
  assert.equal(result.body.data.customOrders[0].user.email, customerEmail)

  result = await jsonRequest(`/admin/custom-orders/${customOrderId}`, { cookie: adminCookie })
  assert.equal(result.status, 200)
  assert.equal(result.body.data.customOrder.description, 'Please create an elegant pastel arrangement with a balanced chocolate selection.')

  result = await jsonRequest(`/admin/custom-orders/${customOrderId}`, {
    method: 'PUT',
    cookie: adminCookie,
    body: { status: 'Quoted', quotedPrice: 7500, adminNote: 'Quote prepared after reviewing the inspiration image.' },
  })
  assert.equal(result.status, 200)
  assert.equal(result.body.data.customOrder.status, 'Quoted')
  assert.equal(result.body.data.customOrder.quotedPrice, 7500)
  assert.equal(result.body.data.customOrder.statusHistory.at(-1).status, 'Quoted')

  result = await jsonRequest('/custom-orders/payment-config', { cookie: customerCookie })
  assert.equal(result.status, 200)
  assert.deepEqual(result.body.data.methods, ['COD', 'Bank Transfer'])
  assert.ok(result.body.data.bankTransfer.accountNumber, 'The active owner bank account must be returned to the customer')

  const paymentForm = new FormData()
  paymentForm.set('paymentMethod', 'Bank Transfer')
  paymentForm.set('addressId', addressId)
  paymentForm.set('paymentReference', 'TEST-TRANSFER-001')
  paymentForm.set('paymentSlip', new Blob([imageBuffer], { type: 'image/jpeg' }), 'payment-slip.jpg')
  response = await fetch(`http://127.0.0.1:5105/api/custom-orders/${customOrderId}/payment`, { method: 'POST', headers: { Cookie: customerCookie }, body: paymentForm })
  const paymentBody = await response.json()
  assert.equal(response.status, 200, `Payment slip submission failed: ${JSON.stringify(paymentBody)}`)
  assert.equal(paymentBody.data.customOrder.paymentStatus, 'Slip Submitted')
  assert.equal(paymentBody.data.customOrder.deliveryAddress.addressLine1, '25 Verification Lane')
  assert.ok(paymentBody.data.customOrder.paymentSlip.url)

  result = await jsonRequest(`/admin/custom-orders/${customOrderId}`, { cookie: adminCookie })
  assert.equal(result.body.data.customOrder.paymentStatus, 'Slip Submitted')
  assert.ok(result.body.data.customOrder.paymentSlip.url, 'Admin must be able to view the payment slip')

  result = await jsonRequest(`/admin/custom-orders/${customOrderId}/payment`, { method: 'PUT', cookie: adminCookie, body: { action: 'approve', note: 'Transfer verified by the automated smoke test.' } })
  assert.equal(result.status, 200)
  assert.equal(result.body.data.customOrder.paymentStatus, 'Paid')
  assert.equal(result.body.data.customOrder.status, 'Approved')

  result = await jsonRequest(`/custom-orders/${customOrderId}`, { cookie: customerCookie })
  assert.equal(result.status, 200)
  assert.equal(result.body.data.customOrder.paymentStatus, 'Paid', 'Customer tracking must show verified payment')

  response = await fetch('http://127.0.0.1:5105/api/custom-orders', { method: 'POST', headers: { Cookie: customerCookie }, body: createForm() })
  const codCreatedBody = await response.json()
  assert.equal(response.status, 201)
  codOrderId = codCreatedBody.data.customOrder._id
  testCounterSequence = Number(codCreatedBody.data.customOrder.requestNumber.split('-').at(-1))
  result = await jsonRequest(`/admin/custom-orders/${codOrderId}`, { method: 'PUT', cookie: adminCookie, body: { status: 'Quoted', quotedPrice: 6400, adminNote: 'COD verification quote.' } })
  assert.equal(result.status, 200)
  const codForm = new FormData()
  codForm.set('paymentMethod', 'COD')
  codForm.set('addressId', addressId)
  response = await fetch(`http://127.0.0.1:5105/api/custom-orders/${codOrderId}/payment`, { method: 'POST', headers: { Cookie: customerCookie }, body: codForm })
  const codBody = await response.json()
  assert.equal(response.status, 200, `COD selection failed: ${JSON.stringify(codBody)}`)
  assert.equal(codBody.data.customOrder.paymentStatus, 'COD Pending')
  assert.equal(codBody.data.customOrder.status, 'Approved')
  result = await jsonRequest(`/admin/custom-orders/${codOrderId}/payment`, { method: 'PUT', cookie: adminCookie, body: { action: 'collect-cod', note: 'COD collected by verification.' } })
  assert.equal(result.status, 200)
  assert.equal(result.body.data.customOrder.paymentStatus, 'COD Collected')

  result = await jsonRequest(`/admin/search?q=${encodeURIComponent(created.requestNumber)}`, { cookie: adminCookie })
  assert.equal(result.status, 200)
  assert.equal(result.body.data.customOrders[0].requestNumber, created.requestNumber, 'Admin global search must find custom orders')

  console.log('Custom-order smoke test passed: quote tracking, saved delivery address, bank details, slip upload/admin approval, COD selection/collection, customer payment history, and admin management.')
} finally {
  if (server) await new Promise((resolve) => server.close(resolve))
  if (customerId) {
    const leftovers = await CustomOrder.find({ user: customerId }).select('inspiration.publicId paymentSlip.publicId')
    await Promise.all(leftovers.flatMap((order) => [order.inspiration?.publicId, order.paymentSlip?.publicId].filter(Boolean).map((publicId) => deleteImage(publicId).catch(() => {}))))
    await Notification.deleteMany({ $or: [{ recipient: { $in: [customerId, adminId].filter(Boolean) } }, { customOrder: { $in: leftovers.map((order) => order._id) } }] })
    await CustomOrder.deleteMany({ user: customerId })
  }
  if (customerId || adminId) await User.deleteMany({ _id: { $in: [customerId, adminId].filter(Boolean) } })
  const currentCounter = await Counter.findById(counterId).lean()
  if (testCounterSequence && currentCounter?.sequence === testCounterSequence) {
    const remainingNumbers = await CustomOrder.find({ requestNumber: new RegExp(`^EDW-CUSTOM-${new Date().getFullYear()}-`) }).select('requestNumber').lean()
    const maximumRemaining = remainingNumbers.reduce((maximum, order) => Math.max(maximum, Number(order.requestNumber.split('-').at(-1)) || 0), 0)
    const restoredSequence = Math.max(originalCounterSequence ?? 0, maximumRemaining)
    if (restoredSequence === 0) await Counter.deleteOne({ _id: counterId })
    else await Counter.updateOne({ _id: counterId }, { sequence: restoredSequence })
  }
  await mongoose.disconnect()
}
