import mongoose from 'mongoose'
import { env } from '../config/env.js'
import Cart from '../models/Cart.js'
import Category from '../models/Category.js'
import Order from '../models/Order.js'
import Product from '../models/Product.js'
import User from '../models/User.js'

const email = 'phase5-browser-customer@example.com', categorySlug = 'phase5-browser-category', productSlug = 'phase5-browser-product'
try {
  await mongoose.connect(env.mongoUri)
  const oldUser = await User.findOne({ email })
  if (oldUser) { await Promise.all([Order.deleteMany({ user: oldUser._id }), Cart.deleteMany({ user: oldUser._id }), User.deleteOne({ _id: oldUser._id })]) }
  await Product.deleteMany({ slug: productSlug }); await Category.deleteMany({ slug: categorySlug })
  if (process.argv[2] === 'remove') console.log('Phase 5 browser fixture removed.')
  else {
    const user = await User.create({ firstName: 'Browser', lastName: 'Customer', email, phone: '0760894222', password: 'BrowserSecure1', role: 'user', addresses: [{ label: 'Home', fullName: 'Browser Customer', phone: '0760894222', addressLine1: '25 Dream Lane', city: 'Batticaloa', district: 'Batticaloa', province: 'Eastern', country: 'Sri Lanka', isDefault: true }] })
    const category = await Category.create({ name: 'Browser Phase 5', slug: categorySlug, description: 'Browser checkout fixture category', isActive: true })
    const product = await Product.create({ name: 'Browser Celebration Box', slug: productSlug, description: 'A browser fixture for checkout and order route verification.', shortDescription: 'Browser checkout fixture.', price: 5000, sku: `EDW-BROWSER-${Date.now()}`, category: category._id, thumbnail: { url: 'https://example.com/browser-product.webp', alt: 'Browser product' }, stock: 5, isActive: true })
    await Cart.create({ user: user._id, items: [{ productId: String(product._id), signature: `${product._id}:browser`, name: product.name, slug: product.slug, image: product.thumbnail.url, price: product.price, quantity: 1, stock: product.stock, category: category.name, customization: {} }], subtotal: product.price })
    const year = new Date().getFullYear(), orderNumber = `EDW-${year}-8${String(Date.now()).slice(-5)}`
    await Order.create({ orderNumber, user: user._id, items: [{ product: product._id, name: product.name, slug: product.slug, sku: product.sku, image: product.thumbnail.url, price: product.price, quantity: 1, customization: {} }], shippingAddress: user.addresses[0], billingAddress: user.addresses[0], subtotal: product.price, shippingFee: 450, discount: 0, total: product.price + 450, paymentMethod: 'COD', paymentStatus: 'Pending', orderStatus: 'Pending', timeline: [{ status: 'Pending', note: 'Browser fixture order', updatedBy: user._id }], estimatedDelivery: new Date(Date.now() + 5 * 86400000) })
    console.log(orderNumber)
  }
} finally { await mongoose.disconnect() }
