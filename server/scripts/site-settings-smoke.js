import assert from 'node:assert/strict'
import mongoose from 'mongoose'

process.env.EDW_DISABLE_EMAIL = 'true'
import app from '../app.js'
import { env } from '../config/env.js'
import Banner from '../models/Banner.js'
import Cart from '../models/Cart.js'
import Category from '../models/Category.js'
import Product from '../models/Product.js'
import SiteSetting from '../models/SiteSetting.js'
import User from '../models/User.js'
import { createCartSignature } from '../utils/cartUtils.js'

const port = 5107
const base = `http://127.0.0.1:${port}/api`
const suffix = Date.now()
const password = 'SettingsSecure1'
const adminEmail = `settings-admin-${suffix}@edw.test`
const customerEmail = `settings-customer-${suffix}@edw.test`
let server
let admin
let customer
let category
let product
let galleryBanner
let backup = null

const settingsPayload = {
  business: { name: 'Eshaz Managed World', tagline: 'Managed from the dashboard', logo: { url: '', publicId: '', width: 0, height: 0, bytes: 0, storage: '' } },
  contact: { phone: '0750894221', whatsapp: '0750894221', email: 'managed@edw.test', location: 'Managed location', mapsHref: 'https://maps.google.com/', mapEmbedUrl: 'https://www.google.com/maps/embed', instagram: 'https://www.instagram.com/eshazdreamworld/', facebook: 'https://www.facebook.com/eshazdreamworld/', tiktok: 'https://www.tiktok.com/@eshazdreamworld' },
  bank: { bankName: 'Verification Bank', accountName: 'Eshaz Managed World', accountNumber: '1234567890', branch: 'Verification Branch', branchCode: '001', instructions: 'Use your order number.' },
  shipping: { standardFee: 525, expressFee: 975, pickupFee: 25, standardDays: 4, expressDays: 2, pickupDays: 1 },
}

async function login(email) {
  const response = await fetch(`${base}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password, rememberMe: false }) })
  assert.equal(response.status, 200)
  return response.headers.get('set-cookie').split(';')[0]
}

async function request(route, { method = 'GET', cookie, body } = {}) {
  const response = await fetch(`${base}${route}`, { method, headers: { ...(cookie && { Cookie: cookie }), ...(body && { 'Content-Type': 'application/json' }) }, body: body ? JSON.stringify(body) : undefined })
  return { status: response.status, body: await response.json() }
}

try {
  await mongoose.connect(env.mongoUri)
  backup = await SiteSetting.findOne({ key: 'store' }).lean()
  await SiteSetting.deleteMany({ key: 'store' })
  admin = await User.create({ firstName: 'Settings', lastName: 'Admin', email: adminEmail, phone: '0751234567', password, role: 'admin' })
  customer = await User.create({ firstName: 'Settings', lastName: 'Customer', email: customerEmail, phone: '0757654321', password, role: 'user' })
  category = await Category.create({ name: `Settings ${suffix}`, slug: `settings-${suffix}`, description: 'Settings verification category' })
  product = await Product.create({ name: 'Settings Verification Product', slug: `settings-product-${suffix}`, category: category._id, description: 'A product used to verify managed delivery fees.', prices: { S: 2500, M: 3000, L: 3500 }, image: { url: 'https://example.com/settings.webp', alt: 'Settings test' } })
  await Cart.create({ user: customer._id, items: [{ productId: String(product._id), signature: createCartSignature(String(product._id), 'S'), name: product.name, slug: product.slug, image: product.image.url, size: 'S', price: 1, quantity: 1, category: category.name }], subtotal: 1 })
  server = app.listen(port)
  await new Promise((resolve) => server.once('listening', resolve))
  const adminCookie = await login(adminEmail)
  const customerCookie = await login(customerEmail)

  let result = await request('/admin/settings', { cookie: adminCookie })
  assert.equal(result.status, 200)
  assert.equal(result.body.data.settings.exists, false)
  result = await request('/admin/settings', { method: 'POST', body: settingsPayload })
  assert.equal(result.status, 401, 'Website settings CRUD must be admin protected')
  result = await request('/admin/settings', { method: 'POST', cookie: adminCookie, body: { ...settingsPayload, bank: { bankName: 'Incomplete' } } })
  assert.equal(result.status, 422, 'Partial bank details must fail validation')
  result = await request('/admin/settings', { method: 'POST', cookie: adminCookie, body: settingsPayload })
  assert.equal(result.status, 201)
  assert.equal(result.body.data.settings.contact.email, 'managed@edw.test')

  result = await request('/site-settings')
  assert.equal(result.status, 200)
  assert.equal(result.body.data.settings.business.name, 'Eshaz Managed World')
  assert.equal(result.body.data.settings.shipping.standardFee, 525)
  assert.equal(result.body.data.settings.bankTransferAvailable, true)
  assert.equal(result.body.data.settings.bank, undefined, 'Public settings must never expose bank account details')
  assert.equal(result.body.data.settings.contact.instagram, settingsPayload.contact.instagram)
  assert.equal(result.body.data.settings.contact.facebook, settingsPayload.contact.facebook)
  assert.equal(result.body.data.settings.contact.tiktok, settingsPayload.contact.tiktok)

  const galleryPayload = {
    title: `Managed gallery ${suffix}`,
    subtitle: 'Managed from Homepage Images',
    image: { url: 'https://example.com/managed-gallery.webp', publicId: '' },
    link: '',
    buttonText: '',
    position: 'gallery',
    isActive: true,
    sortOrder: 7,
    startsAt: null,
    endsAt: null,
  }
  result = await request('/admin/banners', { method: 'POST', cookie: adminCookie, body: galleryPayload })
  assert.equal(result.status, 201)
  galleryBanner = result.body.data.banner
  result = await request('/banners')
  assert.equal(result.status, 200)
  assert.ok(result.body.data.banners.some((banner) => String(banner._id) === String(galleryBanner._id) && banner.position === 'gallery'))
  result = await request(`/admin/banners/${galleryBanner._id}`, { method: 'PUT', cookie: adminCookie, body: { ...galleryPayload, title: `Updated gallery ${suffix}` } })
  assert.equal(result.status, 200)
  assert.equal(result.body.data.banner.title, `Updated gallery ${suffix}`)
  result = await request(`/admin/banners/${galleryBanner._id}`, { method: 'DELETE', cookie: adminCookie })
  assert.equal(result.status, 200)
  galleryBanner = null

  result = await request('/checkout/payment-config', { cookie: customerCookie })
  assert.deepEqual(result.body.data.methods, ['COD', 'Bank Transfer'])
  assert.equal(result.body.data.bankTransfer.accountNumber, '1234567890')
  const address = { fullName: 'Settings Customer', phone: '0757654321', addressLine1: '10 Settings Lane', city: 'Batticaloa', district: 'Batticaloa', province: 'Eastern', country: 'Sri Lanka' }
  result = await request('/checkout/quote', { method: 'POST', cookie: customerCookie, body: { shippingAddress: address, billingAddress: address, billingSameAsShipping: true, shippingMethod: 'standard' } })
  assert.equal(result.status, 200)
  assert.equal(result.body.data.quote.shippingFee, 525)
  assert.equal(result.body.data.quote.total, 3025)

  result = await request('/admin/settings', { method: 'PUT', cookie: adminCookie, body: { ...settingsPayload, contact: { ...settingsPayload.contact, email: 'updated@edw.test' }, shipping: { ...settingsPayload.shipping, standardFee: 600 } } })
  assert.equal(result.status, 200)
  assert.equal(result.body.data.settings.contact.email, 'updated@edw.test')
  result = await request('/checkout/quote', { method: 'POST', cookie: customerCookie, body: { shippingAddress: address, billingAddress: address, billingSameAsShipping: true, shippingMethod: 'standard' } })
  assert.equal(result.body.data.quote.shippingFee, 600)
  assert.equal(result.body.data.quote.total, 3100)

  result = await request('/admin/settings', { method: 'DELETE', cookie: adminCookie })
  assert.equal(result.status, 200)
  result = await request('/admin/settings', { cookie: adminCookie })
  assert.equal(result.body.data.settings.exists, false)
  console.log('Site-settings smoke test passed: protected settings CRUD, homepage gallery CRUD, public privacy, bank enablement, contact updates, and server-controlled delivery fees.')
} finally {
  if (server) await new Promise((resolve) => server.close(resolve))
  await SiteSetting.deleteMany({ key: 'store' })
  if (backup) await SiteSetting.collection.insertOne(backup)
  if (customer?._id) await Cart.deleteMany({ user: customer._id })
  if (product?._id) await Product.deleteOne({ _id: product._id })
  if (category?._id) await Category.deleteOne({ _id: category._id })
  if (galleryBanner?._id) await Banner.deleteOne({ _id: galleryBanner._id })
  await User.deleteMany({ email: { $in: [adminEmail, customerEmail] } })
  await mongoose.disconnect()
}
