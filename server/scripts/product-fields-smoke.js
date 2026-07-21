import assert from 'node:assert/strict'
import mongoose from 'mongoose'
import dotenv from 'dotenv'
import Category from '../models/Category.js'
import Product from '../models/Product.js'
import User from '../models/User.js'
import Cart from '../models/Cart.js'
import { productValidator } from '../middleware/adminValidateMiddleware.js'
import app from '../app.js'

dotenv.config()

let productIds = []
let temporaryCategoryId = null
let adminId = null
let server = null

try {
  await mongoose.connect(process.env.MONGODB_URI)
  let category = await Category.findOne()
  if (!category) {
    const suffix = Date.now()
    category = await Category.create({ name: `Product Test ${suffix}`, slug: `product-test-${suffix}`, description: 'Temporary product test category' })
    temporaryCategoryId = category._id
  }

  const input = {
    name: 'Size Price Verification Product',
    category: String(category._id),
    description: 'A product created to verify the simplified product fields.',
    prices: { S: 1000, M: 1250, L: 1500 },
    image: { url: 'https://example.com/product.webp', publicId: '', alt: 'Verification product' },
    sku: 'THIS-MUST-BE-IGNORED',
    stock: 99,
    isFeatured: true,
  }
  const validated = productValidator(input)
  assert.equal(validated.errors.length, 0)
  assert.deepEqual(Object.keys(validated.values).sort(), ['category', 'description', 'image', 'name', 'prices'])

  for (const number of [1, 2]) {
    const product = await Product.create({ ...validated.values, name: `${validated.values.name} ${number}`, slug: `size-price-verification-${Date.now()}-${number}` })
    productIds.push(product._id)
    const stored = await Product.collection.findOne({ _id: product._id })
    for (const removedField of ['sku', 'stock', 'discountPrice', 'costPrice', 'shortDescription', 'thumbnail', 'images', 'tags', 'isFeatured', 'isTrending', 'isActive', 'isDeleted']) {
      assert.equal(Object.hasOwn(stored, removedField), false, `${removedField} must not be stored`)
    }
    assert.deepEqual(stored.prices, { S: 1000, M: 1250, L: 1500 })
  }

  await Product.deleteMany({ _id: { $in: productIds } })
  productIds = []

  const suffix = Date.now()
  const email = `product-fields-${suffix}@example.com`
  const admin = await User.create({ firstName: 'Product', lastName: 'Tester', email, phone: '0771234567', password: 'SecureAdmin1', role: 'admin' })
  adminId = admin._id
  server = app.listen(5104)
  await new Promise((resolve) => server.once('listening', resolve))

  let cookie = ''
  const request = async (path, { method = 'GET', body } = {}) => {
    const response = await fetch(`http://127.0.0.1:5104/api${path}`, { method, headers: { ...(body && { 'Content-Type': 'application/json' }), ...(cookie && { Cookie: cookie }) }, body: body ? JSON.stringify(body) : undefined })
    const setCookie = response.headers.get('set-cookie')
    if (setCookie) cookie = setCookie.split(';')[0]
    return { status: response.status, body: await response.json() }
  }

  let result = await request('/auth/login', { method: 'POST', body: { email, password: 'SecureAdmin1', rememberMe: false } })
  assert.equal(result.status, 200)
  result = await request('/admin/products', { method: 'POST', body: { ...input, prices: { S: 1000, M: 1250 } } })
  assert.equal(result.status, 422, 'All three size prices are required')
  result = await request('/admin/products', { method: 'POST', body: input })
  assert.equal(result.status, 201)
  const apiProduct = result.body.data.product
  productIds.push(apiProduct._id)
  assert.equal(apiProduct.stock, undefined)
  assert.deepEqual(apiProduct.prices, { S: 1000, M: 1250, L: 1500 })
  result = await request(`/products/${apiProduct.slug}`)
  assert.equal(result.status, 200)
  result = await request('/cart/items', { method: 'POST', body: { productId: apiProduct._id, size: 'L', quantity: 1, price: 1 } })
  assert.equal(result.status, 201)
  assert.equal(result.body.data.cart.items[0].size, 'L')
  assert.equal(result.body.data.cart.items[0].price, 1500, 'The API must use the stored L price')
  await request('/cart', { method: 'DELETE' })
  result = await request(`/admin/products/${apiProduct._id}`, { method: 'PUT', body: { ...input, name: 'Updated Size Price Product', prices: { S: 1100, M: 1400, L: 1700 } } })
  assert.equal(result.status, 200)
  assert.equal(result.body.data.product.prices.L, 1700)
  const updatedSlug = result.body.data.product.slug
  result = await request(`/admin/products/${apiProduct._id}`, { method: 'DELETE' })
  assert.equal(result.status, 200)
  productIds = []
  result = await request(`/products/${updatedSlug}`)
  assert.equal(result.status, 404)

  console.log('Product fields smoke test passed: exact-field validation, independent S/M/L prices, trusted cart pricing, admin CRUD, public detail, and permanent deletion.')
} finally {
  if (server) await new Promise((resolve) => server.close(resolve))
  if (productIds.length) await Product.deleteMany({ _id: { $in: productIds } })
  if (adminId) await Cart.deleteOne({ user: adminId })
  if (adminId) await User.deleteOne({ _id: adminId })
  if (temporaryCategoryId) await Category.deleteOne({ _id: temporaryCategoryId })
  await mongoose.disconnect()
}
