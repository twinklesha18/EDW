import assert from 'node:assert/strict'
import mongoose from 'mongoose'
import { env } from '../config/env.js'
import Cart from '../models/Cart.js'
import User from '../models/User.js'
import Wishlist from '../models/Wishlist.js'
import app from '../app.js'
import Category from '../models/Category.js'
import Product from '../models/Product.js'
import Notification from '../models/Notification.js'

process.env.EDW_DISABLE_EMAIL = 'true'

const testPort = 5099
const apiUrl = `http://127.0.0.1:${testPort}/api`
const suffix = Date.now()
const email = `phase3-${suffix}@edw.test`
const adminEmail = `phase3-admin-${suffix}@edw.test`
let cookie = ''
let userId
let admin
let server
let testCategory
let testProducts = []

async function request(path, { method = 'GET', body, authenticated = true } = {}) {
  const response = await fetch(`${apiUrl}${path}`, {
    method,
    headers: { ...(body ? { 'Content-Type': 'application/json' } : {}), ...(authenticated && cookie ? { Cookie: cookie } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  })
  const setCookies = response.headers.getSetCookie?.() || [response.headers.get('set-cookie')].filter(Boolean)
  if (setCookies.length) cookie = setCookies.at(-1).split(';')[0]
  const payload = await response.json()
  return { status: response.status, payload }
}

const address = (number) => ({ label: `Address ${number}`, fullName: 'Phase Three User', phone: '+94771234567', addressLine1: `${number} Dream Lane`, addressLine2: '', city: 'Colombo', district: 'Colombo', province: 'Western', postalCode: `1000${number}`, country: 'Sri Lanka', isDefault: false })
const productIdFor = (key) => String(testProducts.find((product) => product.slug === `smoke-test-${key}-${suffix}`)?._id || key)
const cartItem = (key, message = '') => ({ productId: productIdFor(key), size: 'S', quantity: 1, customization: { message, preferredColor: 'Pink', notes: '' } })
const wishItem = (key) => ({ productId: productIdFor(key) })

try {
  await mongoose.connect(env.mongoUri)
  admin = await User.create({ firstName: 'Phase', lastName: 'Admin', email: adminEmail, phone: '+94771111111', password: 'SecurePass1', role: 'admin' })
  testCategory = await Category.create({ name: `Phase 3 Test ${Date.now()}`, slug: `phase3-test-${Date.now()}`, description: 'Temporary category for Phase 3 compatibility verification.' })
  testProducts = await Product.create(['phase-product-1', 'guest-product', 'wish-1', 'guest-wish'].map((productId) => ({
    name: 'Smoke Test Gift',
    slug: `smoke-test-${productId}-${suffix}`,
    description: 'A temporary product used for automated cart and wishlist compatibility verification.',
    category: testCategory._id,
    prices: { S: 1000, M: 1200, L: 1400 },
    image: { url: '/test-gift.jpg', alt: 'Test gift' },
  })))
  server = app.listen(testPort)
  await new Promise((resolve) => server.once('listening', resolve))

  let result = await request('/auth/register', { method: 'POST', authenticated: false, body: { firstName: 'Phase', lastName: 'Tester', email, phone: '+94771234567', password: 'weak', confirmPassword: 'weak' } })
  assert.equal(result.status, 422, 'Invalid password must be rejected')

  result = await request('/auth/register', { method: 'POST', authenticated: false, body: { firstName: 'Phase', lastName: 'Tester', email, phone: '+94771234567', password: 'SecurePass1', confirmPassword: 'SecurePass1' } })
  assert.equal(result.status, 201, 'Registration must succeed')
  assert.ok(cookie.startsWith('edw_token='), 'Registration must set the auth cookie')
  assert.equal(result.payload.data.user.password, undefined, 'Password must not be returned')
  userId = result.payload.data.user.id
  const registrationNotification = await Notification.findOne({ recipient: admin._id, type: 'new_user', message: { $regex: email } })
  assert.ok(registrationNotification, 'Administrators must be notified when a customer registers')

  result = await request('/auth/register', { method: 'POST', authenticated: false, body: { firstName: 'Phase', lastName: 'Tester', email, phone: '+94771234567', password: 'SecurePass1', confirmPassword: 'SecurePass1' } })
  assert.equal(result.status, 409, 'Duplicate email must be rejected')

  result = await request('/auth/me')
  assert.equal(result.status, 200, 'Cookie authentication must persist')

  result = await request('/auth/login', { method: 'POST', authenticated: false, body: { email, password: 'WrongPass1', rememberMe: false } })
  assert.equal(result.status, 401, 'Invalid login must be rejected')

  result = await request('/users/profile', { method: 'PUT', body: { firstName: 'Phase', lastName: 'Verified', phone: '+94770000000', avatar: '' } })
  assert.equal(result.status, 200, 'Profile update must succeed')
  assert.equal(result.payload.data.user.lastName, 'Verified')

  result = await request('/users/change-password', { method: 'PUT', body: { currentPassword: 'SecurePass1', newPassword: 'NewSecure2', confirmNewPassword: 'NewSecure2' } })
  assert.equal(result.status, 200, 'Password change must succeed')

  const addressIds = []
  for (let number = 1; number <= 5; number += 1) {
    result = await request('/users/addresses', { method: 'POST', body: address(number) })
    assert.equal(result.status, 201, `Address ${number} must be saved`)
    addressIds.push(result.payload.data.address._id)
  }
  assert.equal(result.payload.data.user.addresses.length, 5)
  result = await request('/users/addresses', { method: 'POST', body: address(6) })
  assert.equal(result.status, 400, 'A sixth address must be rejected')
  result = await request(`/users/addresses/${addressIds[0]}`, { method: 'PUT', body: { ...address(1), label: 'Updated Home' } })
  assert.equal(result.status, 200, 'Address update must succeed')
  result = await request(`/users/addresses/${addressIds[1]}/default`, { method: 'PUT' })
  assert.equal(result.status, 200, 'Setting a default address must succeed')
  assert.equal(result.payload.data.user.addresses.filter((entry) => entry.isDefault).length, 1)
  result = await request(`/users/addresses/${addressIds[1]}`, { method: 'DELETE' })
  assert.equal(result.status, 200, 'Deleting an address must succeed')
  assert.equal(result.payload.data.user.addresses.filter((entry) => entry.isDefault).length, 1, 'A replacement default address is required')

  result = await request('/cart/items', { method: 'POST', body: cartItem('phase-product-1') })
  assert.equal(result.status, 201, 'Adding to cart must succeed')
  result = await request('/cart/items', { method: 'POST', body: { ...cartItem('phase-product-1'), quantity: 2 } })
  assert.equal(result.payload.data.cart.items.length, 1, 'Identical customization must merge')
  assert.equal(result.payload.data.cart.itemCount, 3)
  result = await request('/cart/items', { method: 'POST', body: cartItem('phase-product-1', 'Different message') })
  assert.equal(result.payload.data.cart.items.length, 2, 'Different customization must create another row')
  assert.equal(result.payload.data.cart.subtotal, 4000, 'Backend must calculate subtotal')
  result = await request('/cart/items', { method: 'POST', body: { ...cartItem('phase-product-1'), quantity: 100 } })
  assert.equal(result.status, 422, 'Quantity limits must be enforced')
  result = await request('/cart/sync', { method: 'POST', body: { items: [cartItem('guest-product')] } })
  assert.equal(result.status, 200, 'Guest cart sync must succeed')
  const cartItemId = result.payload.data.cart.items[0]._id
  result = await request(`/cart/items/${cartItemId}`, { method: 'PUT', body: { quantity: 2 } })
  assert.equal(result.status, 200, 'Cart quantity update must succeed')
  result = await request(`/cart/items/${cartItemId}`, { method: 'DELETE' })
  assert.equal(result.status, 200, 'Cart item removal must succeed')
  result = await request('/cart', { method: 'DELETE' })
  assert.equal(result.payload.data.cart.itemCount, 0, 'Cart clear must succeed')

  result = await request('/wishlist/items', { method: 'POST', body: wishItem('wish-1') })
  assert.equal(result.status, 201, 'Wishlist add must succeed')
  result = await request('/wishlist/items', { method: 'POST', body: wishItem('wish-1') })
  assert.equal(result.payload.data.wishlist.count, 1, 'Wishlist duplicates must be prevented')
  result = await request('/wishlist/sync', { method: 'POST', body: { items: [wishItem('guest-wish')] } })
  assert.equal(result.payload.data.wishlist.count, 2, 'Guest wishlist sync must succeed')
  const wishProductId = result.payload.data.wishlist.items.find((item) => item.slug === `smoke-test-wish-1-${suffix}`).productId
  result = await request(`/wishlist/items/${wishProductId}`, { method: 'DELETE' })
  assert.equal(result.payload.data.wishlist.count, 1, 'Wishlist removal must succeed')
  result = await request('/wishlist', { method: 'DELETE' })
  assert.equal(result.payload.data.wishlist.count, 0, 'Wishlist clear must succeed')

  result = await request('/auth/forgot-password', { method: 'POST', authenticated: false, body: { email } })
  assert.equal(result.status, 200, 'Forgot password must return a safe response')
  assert.equal(result.payload.data.developmentOnly, true, 'Development reset URL must be labelled')
  const resetToken = result.payload.data.resetUrl.split('/').at(-1)
  result = await request(`/auth/reset-password/${resetToken}`, { method: 'POST', authenticated: false, body: { password: 'ResetSecure3', confirmPassword: 'ResetSecure3' } })
  assert.equal(result.status, 200, 'Password reset must succeed')
  result = await request('/auth/me')
  assert.equal(result.status, 200, 'Reset must log the user in')

  result = await request('/auth/logout', { method: 'POST' })
  assert.equal(result.status, 200, 'Logout must succeed')
  result = await request('/auth/me')
  assert.equal(result.status, 401, 'Cleared cookie must reject protected requests')
  result = await request('/auth/login', { method: 'POST', authenticated: false, body: { email, password: 'ResetSecure3', rememberMe: true } })
  assert.equal(result.status, 200, 'Login with reset password must succeed')

  console.log('Phase 3 API smoke test passed: 38 assertions across auth, profile, addresses, cart, wishlist, reset and persistence.')
} finally {
  await Notification.deleteMany({ type: 'new_user', message: { $regex: email } })
  if (userId) {
    await Promise.all([Cart.deleteMany({ user: userId }), Wishlist.deleteMany({ user: userId }), User.deleteOne({ _id: userId })])
  } else await User.deleteOne({ email })
  if (admin?._id) await User.deleteOne({ _id: admin._id })
  if (server) await new Promise((resolve) => server.close(resolve))
  if (testProducts.length) await Product.deleteMany({ _id: { $in: testProducts.map((product) => product._id) } })
  if (testCategory) await Category.deleteOne({ _id: testCategory._id })
  await mongoose.disconnect()
}
