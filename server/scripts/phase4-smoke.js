import assert from 'node:assert/strict'
import mongoose from 'mongoose'
import app from '../app.js'
import { env } from '../config/env.js'
import Banner from '../models/Banner.js'
import Category from '../models/Category.js'
import Coupon from '../models/Coupon.js'
import Order from '../models/Order.js'
import Product from '../models/Product.js'
import Review from '../models/Review.js'
import User from '../models/User.js'

const port = 5100, base = `http://127.0.0.1:${port}/api`, suffix = Date.now()
const adminEmail = `phase4-admin-${suffix}@example.com`, userEmail = `phase4-user-${suffix}@example.com`
let server, admin, user, category, product, order, coupon, banner, review, cookie = ''
async function request(path, { method = 'GET', body, authCookie = cookie } = {}) { const response = await fetch(`${base}${path}`, { method, headers: { ...(body ? { 'Content-Type': 'application/json' } : {}), ...(authCookie ? { Cookie: authCookie } : {}) }, body: body ? JSON.stringify(body) : undefined }); const setCookie = response.headers.get('set-cookie'); if (setCookie) cookie = setCookie.split(';')[0]; return { status: response.status, body: await response.json() } }
const productPayload = (overrides = {}) => ({ name: 'Phase Four Luxury Bouquet', slug: `phase-four-luxury-${suffix}`, description: 'A complete production catalog product created by the Phase 4 automated API verification suite.', shortDescription: 'A refined bouquet used to verify catalog management.', price: 12000, discountPrice: 10500, costPrice: 6000, sku: `EDW-P4-${suffix}`, category: category.id, subCategory: null, thumbnail: { url: 'https://example.com/phase4-thumbnail.webp', publicId: 'eshaz-dream-world/test-thumbnail', alt: 'Phase Four Luxury Bouquet' }, images: [{ url: 'https://example.com/phase4-image.webp', publicId: 'eshaz-dream-world/test-image', alt: 'Gallery' }], stock: 8, sold: 2, tags: ['phase4', 'luxury'], isFeatured: true, isTrending: false, isActive: true, weight: 1.2, dimensions: { length: 30, width: 25, height: 45, unit: 'cm' }, ...overrides })
try {
  await mongoose.connect(env.mongoUri); server = app.listen(port); await new Promise((resolve) => server.once('listening', resolve))
  admin = await User.create({ firstName: 'Phase', lastName: 'Admin', email: adminEmail, phone: '+94770000001', password: 'SecureAdmin1', role: 'admin' })
  user = await User.create({ firstName: 'Phase', lastName: 'Customer', email: userEmail, phone: '+94770000002', password: 'SecureUser1', role: 'user' })

  let result = await request('/auth/login', { method: 'POST', body: { email: userEmail, password: 'SecureUser1', rememberMe: false }, authCookie: '' }); const userCookie = cookie
  assert.equal(result.status, 200); result = await request('/admin/dashboard', { authCookie: userCookie }); assert.equal(result.status, 403, 'Normal users must receive 403')
  result = await request('/auth/login', { method: 'POST', body: { email: adminEmail, password: 'SecureAdmin1', rememberMe: false }, authCookie: '' }); const adminCookie = cookie; assert.equal(result.status, 200)

  result = await request('/admin/categories', { method: 'POST', authCookie: adminCookie, body: { name: 'Phase Four Category', slug: `phase-four-${suffix}`, description: 'Category used for complete Phase 4 verification.', image: { url: 'https://example.com/category.webp', publicId: 'eshaz-dream-world/test-category' }, parentCategory: null, isActive: true, sortOrder: 1 } }); assert.equal(result.status, 201); category = result.body.data.category
  result = await request('/admin/categories', { method: 'POST', authCookie: adminCookie, body: { name: 'Duplicate Category', slug: category.slug, description: 'Duplicate category slug should never be accepted.', isActive: true, sortOrder: 2 } }); assert.equal(result.status, 409, 'Duplicate category slug must fail')

  result = await request('/admin/products', { method: 'POST', authCookie: adminCookie, body: productPayload({ price: -1 }) }); assert.equal(result.status, 422, 'Invalid price must fail')
  result = await request('/admin/products', { method: 'POST', authCookie: adminCookie, body: productPayload() }); assert.equal(result.status, 201); product = result.body.data.product
  result = await request('/admin/products', { method: 'POST', authCookie: adminCookie, body: productPayload({ name: 'Duplicate SKU', slug: `duplicate-${suffix}` }) }); assert.equal(result.status, 409, 'Duplicate SKU must fail')
  result = await request(`/products/${product.slug}`, { authCookie: '' }); assert.equal(result.status, 200, 'Public product detail must work')
  result = await request(`/admin/products/${product.id}/status`, { method: 'PATCH', authCookie: adminCookie, body: { isTrending: true } }); assert.equal(result.status, 200); assert.equal(result.body.data.product.isTrending, true)
  result = await request(`/admin/products/${product.id}`, { method: 'PUT', authCookie: adminCookie, body: productPayload({ name: 'Updated Phase Four Bouquet', stock: 4 }) }); assert.equal(result.status, 200); assert.equal(result.body.data.product.stock, 4)

  result = await request('/reviews', { method: 'POST', authCookie: userCookie, body: { productId: product.id, rating: 5, title: 'Beautiful', comment: 'A genuinely beautiful customized creation.' } }); assert.equal(result.status, 201); review = result.body.data.review
  result = await request(`/reviews/${review.id}`, { method: 'PUT', authCookie: userCookie, body: { rating: 4, title: 'Lovely', comment: 'Updated review with thoughtful details.' } }); assert.equal(result.status, 200)
  result = await request('/admin/reviews', { authCookie: adminCookie }); assert.equal(result.status, 200); assert.ok(result.body.data.reviews.some((entry) => entry.id === review.id))
  result = await request(`/admin/reviews/${review.id}/moderate`, { method: 'PATCH', authCookie: adminCookie, body: { isVisible: false } }); assert.equal(result.status, 200)

  result = await request('/admin/coupons', { method: 'POST', authCookie: adminCookie, body: { code: `P4${suffix}`, discountType: 'percentage', discountValue: 10, minimumAmount: 5000, maximumDiscount: 2000, expiryDate: new Date(Date.now() + 86400000).toISOString(), usageLimit: 10, isActive: true } }); assert.equal(result.status, 201); coupon = result.body.data.coupon
  result = await request(`/admin/coupons/${coupon.id}/toggle`, { method: 'PATCH', authCookie: adminCookie }); assert.equal(result.status, 200); assert.equal(result.body.data.coupon.isActive, false)

  result = await request('/admin/banners', { method: 'POST', authCookie: adminCookie, body: { title: 'Phase 4 Banner', subtitle: 'Verified banner', image: { url: 'https://example.com/banner.webp', publicId: 'eshaz-dream-world/test-banner' }, link: '/shop', buttonText: 'Shop', position: 'hero', isActive: true, sortOrder: 1 } }); assert.equal(result.status, 201); banner = result.body.data.banner
  result = await request('/banners', { authCookie: '' }); assert.equal(result.status, 200); assert.ok(result.body.data.banners.some((entry) => entry.id === banner.id))

  const address = { fullName: 'Phase Customer', phone: '+94770000002', addressLine1: '1 Dream Lane', addressLine2: '', city: 'Colombo', district: 'Colombo', province: 'Western', postalCode: '00100', country: 'Sri Lanka' }
  order = await Order.create({ orderNumber: `EDW-${suffix}`, user: user._id, items: [{ product: product.id, name: product.name, sku: product.sku, image: product.thumbnail.url, price: 10500, quantity: 1, customization: {} }], shippingAddress: address, billingAddress: address, subtotal: 10500, shippingFee: 500, discount: 0, total: 11000, paymentStatus: 'Paid', orderStatus: 'Pending' })
  result = await request('/admin/orders', { authCookie: adminCookie }); assert.equal(result.status, 200); assert.ok(result.body.data.orders.some((entry) => entry.id === order.id))
  result = await request(`/admin/orders/${order.id}`, { method: 'PUT', authCookie: adminCookie, body: { orderStatus: 'Processing', paymentStatus: 'Paid', trackingNumber: 'TRACK-P4', notes: 'Verified' } }); assert.equal(result.status, 200); assert.equal(result.body.data.order.orderStatus, 'Processing')

  result = await request('/admin/users?role=user', { authCookie: adminCookie }); assert.equal(result.status, 200); assert.ok(result.body.data.users.some((entry) => entry.id === user.id))
  result = await request(`/admin/users/${user.id}/access`, { method: 'PUT', authCookie: adminCookie, body: { isActive: false } }); assert.equal(result.status, 200); assert.equal(result.body.data.user.isActive, false)
  result = await request(`/admin/users/${admin.id}/access`, { method: 'PUT', authCookie: adminCookie, body: { role: 'user' } }); assert.equal(result.status, 409, 'Admin cannot demote self')

  result = await request('/admin/dashboard', { authCookie: adminCookie }); assert.equal(result.status, 200); assert.ok(result.body.data.summary.products >= 1)
  result = await request(`/admin/search?q=${encodeURIComponent('Updated Phase')}`, { authCookie: adminCookie }); assert.equal(result.status, 200); assert.ok(result.body.data.products.length >= 1)
  result = await request(`/admin/products/${product.id}`, { method: 'DELETE', authCookie: adminCookie }); assert.equal(result.status, 200)
  result = await request(`/products/${product.slug}`, { authCookie: '' }); assert.equal(result.status, 404, 'Soft-deleted product must leave storefront')
  result = await request(`/admin/products/${product.id}/restore`, { method: 'POST', authCookie: adminCookie, body: {} }); assert.equal(result.status, 200)
  result = await request(`/admin/products/${product.id}/permanent`, { method: 'DELETE', authCookie: adminCookie }); assert.equal(result.status, 409, 'Active products cannot be permanently deleted')
  result = await request(`/admin/products/${product.id}`, { method: 'DELETE', authCookie: adminCookie }); assert.equal(result.status, 200)
  result = await request(`/admin/products/${product.id}/permanent`, { method: 'DELETE', authCookie: adminCookie }); assert.equal(result.status, 200)
  result = await request(`/admin/products/${product.id}`, { authCookie: adminCookie }); assert.equal(result.status, 404, 'Permanently deleted product must not exist')

  console.log('Phase 4 API smoke test passed: admin authorization, catalog CRUD, validation, reviews, coupons, banners, users, orders, analytics, search, soft delete, restore and permanent delete.')
} finally {
  if (review?._id || review?.id) await Review.deleteOne({ _id: review._id || review.id })
  if (order?._id) await Order.deleteOne({ _id: order._id })
  if (coupon?._id || coupon?.id) await Coupon.deleteOne({ _id: coupon._id || coupon.id })
  if (banner?._id || banner?.id) await Banner.deleteOne({ _id: banner._id || banner.id })
  if (product?._id || product?.id) await Product.deleteOne({ _id: product._id || product.id })
  if (category?._id || category?.id) await Category.deleteOne({ _id: category._id || category.id })
  if (admin?._id) await User.deleteOne({ _id: admin._id }); if (user?._id) await User.deleteOne({ _id: user._id })
  if (server) await new Promise((resolve) => server.close(resolve)); await mongoose.disconnect()
}
