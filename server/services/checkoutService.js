import Cart from '../models/Cart.js'
import Coupon from '../models/Coupon.js'
import Counter from '../models/Counter.js'
import Order from '../models/Order.js'
import Product from '../models/Product.js'
import { AppError } from '../utils/responseUtils.js'

const SHIPPING = Object.freeze({
  standard: { label: 'Standard Delivery', fee: 450, days: 5 },
  express: { label: 'Express Delivery', fee: 900, days: 2 },
  pickup: { label: 'Store Pickup', fee: 0, days: 1 },
})
const roundMoney = (value) => Math.round((Number(value) + Number.EPSILON) * 100) / 100

export async function buildCheckoutQuote(userId, checkoutData) {
  const cart = await Cart.findOne({ user: userId })
  if (!cart?.items.length) throw new AppError('Your cart is empty', 400)
  const productIds = cart.items.map((item) => item.productId)
  const products = await Product.find({ _id: { $in: productIds } })
  const productMap = new Map(products.map((product) => [String(product._id), product]))
  const items = cart.items.map((cartItem) => {
    const product = productMap.get(cartItem.productId)
    if (!product) throw new AppError(`${cartItem.name} is no longer available`, 409)
    const price = roundMoney(product.prices?.[cartItem.size])
    if (!price) throw new AppError(`${cartItem.size} size is no longer available for ${product.name}`, 409)
    return { product: product._id, name: product.name, slug: product.slug, size: cartItem.size, image: product.image.url, price, quantity: cartItem.quantity, customization: cartItem.customization }
  })
  const subtotal = roundMoney(items.reduce((sum, item) => sum + item.price * item.quantity, 0))
  const shipping = SHIPPING[checkoutData.shippingMethod]
  let coupon = null, discount = 0
  if (checkoutData.couponCode) {
    coupon = await Coupon.findOne({ code: checkoutData.couponCode })
    if (!coupon || !coupon.isActive) throw new AppError('Coupon is invalid or inactive', 422)
    if (coupon.expiryDate <= new Date()) throw new AppError('Coupon has expired', 422)
    if (coupon.usedCount >= coupon.usageLimit) throw new AppError('Coupon usage limit has been reached', 422)
    if (coupon.redemptions.some((entry) => String(entry.user) === String(userId))) throw new AppError('This coupon has already been used by your account', 422)
    if (subtotal < coupon.minimumAmount) throw new AppError(`A minimum subtotal of LKR ${coupon.minimumAmount.toLocaleString()} is required for this coupon`, 422)
    discount = coupon.discountType === 'percentage' ? subtotal * (coupon.discountValue / 100) : coupon.discountValue
    if (coupon.maximumDiscount !== null) discount = Math.min(discount, coupon.maximumDiscount)
    discount = roundMoney(Math.min(discount, subtotal))
  }
  const shippingFee = roundMoney(shipping.fee)
  const total = roundMoney(Math.max(0, subtotal + shippingFee - discount))
  if (total <= 0) throw new AppError('Order total must be greater than zero', 422)
  const estimatedDelivery = new Date(Date.now() + shipping.days * 86400000)
  return {
    items, shippingAddress: checkoutData.shippingAddress, billingAddress: checkoutData.billingAddress,
    shippingMethod: checkoutData.shippingMethod, shippingLabel: shipping.label, couponCode: coupon?.code || '',
    coupon: coupon ? { id: coupon._id, code: coupon.code, discountType: coupon.discountType, discountValue: coupon.discountValue } : null,
    subtotal, shippingFee, discount, total, estimatedDelivery,
  }
}

async function nextOrderNumber() {
  const year = new Date().getFullYear()
  const counter = await Counter.findOneAndUpdate({ _id: `orders-${year}` }, { $inc: { sequence: 1 } }, { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true })
  return `EDW-${year}-${String(counter.sequence).padStart(6, '0')}`
}

export async function releaseInventory() {}

async function consumeCoupon(quote, userId, orderId) {
  if (!quote.coupon?.id || !quote.coupon?.code) return false
  const coupon = await Coupon.findOneAndUpdate(
    { _id: quote.coupon.id, isActive: true, expiryDate: { $gt: new Date() }, $expr: { $lt: ['$usedCount', '$usageLimit'] }, 'redemptions.user': { $ne: userId } },
    { $inc: { usedCount: 1 }, $push: { redemptions: { user: userId, order: orderId, usedAt: new Date() } } },
    { returnDocument: 'after' },
  )
  if (!coupon) throw new AppError('Coupon can no longer be redeemed', 409)
  return true
}

export async function releaseCoupon(order) {
  if (!order.coupon?.code) return
  await Coupon.updateOne({ code: order.coupon.code, 'redemptions.order': order._id }, { $inc: { usedCount: -1 }, $pull: { redemptions: { order: order._id } } })
}

export async function createOrderFromQuote({ user, quote, paymentMethod, paymentIntent = null }) {
  if (paymentIntent) {
    const existing = await Order.findOne({ 'payment.intentId': paymentIntent.id })
    if (existing) return { order: existing, duplicate: true }
  }
  const order = new Order({
    orderNumber: await nextOrderNumber(), user: user._id, items: quote.items,
    shippingAddress: quote.shippingAddress, billingAddress: quote.billingAddress,
    subtotal: quote.subtotal, shippingFee: quote.shippingFee, discount: quote.discount, total: quote.total,
    coupon: quote.coupon?.id && quote.coupon?.code ? { code: quote.coupon.code, discountType: quote.coupon.discountType, discountValue: quote.coupon.discountValue } : undefined,
    shippingMethod: quote.shippingMethod, estimatedDelivery: quote.estimatedDelivery,
    paymentMethod, paymentStatus: paymentMethod === 'Stripe' ? 'Paid' : 'Pending', orderStatus: 'Pending',
    payment: paymentMethod === 'Stripe' ? { provider: 'stripe', intentId: paymentIntent.id, transactionId: paymentIntent.latest_charge || paymentIntent.id, currency: paymentIntent.currency.toUpperCase(), amount: quote.total, paidAt: new Date() } : { provider: 'cod', currency: 'LKR', amount: quote.total },
    timeline: [{ status: 'Pending', timestamp: new Date(), note: paymentMethod === 'COD' ? 'Order placed with Cash on Delivery' : 'Card payment confirmed by Stripe', updatedBy: user._id }],
  })
  let couponConsumed = false, saved = false
  try {
    couponConsumed = await consumeCoupon(quote, user._id, order._id)
    await order.save()
    saved = true
  } catch (error) {
    if (!saved && couponConsumed) await releaseCoupon(order)
    throw error
  }
  await Cart.updateOne({ user: user._id }, { $set: { items: [], subtotal: 0 } })
  return { order, duplicate: false }
}

export const publicQuote = (quote) => ({
  items: quote.items, shippingMethod: quote.shippingMethod, shippingLabel: quote.shippingLabel,
  coupon: quote.coupon ? { code: quote.coupon.code, discountType: quote.coupon.discountType, discountValue: quote.coupon.discountValue } : null,
  subtotal: quote.subtotal, shippingFee: quote.shippingFee, discount: quote.discount, total: quote.total, estimatedDelivery: quote.estimatedDelivery,
})
