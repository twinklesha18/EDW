import Cart from '../models/Cart.js'
import Counter from '../models/Counter.js'
import Order from '../models/Order.js'
import Product from '../models/Product.js'
import { AppError } from '../utils/responseUtils.js'
import { getResolvedSiteSettings } from './siteSettingsService.js'

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
  const { shipping: configuredShipping } = await getResolvedSiteSettings()
  const shippingOptions = {
    standard: { label: 'Standard Delivery', fee: configuredShipping.standardFee, days: configuredShipping.standardDays },
    express: { label: 'Express Delivery', fee: configuredShipping.expressFee, days: configuredShipping.expressDays },
    pickup: { label: 'Store Pickup', fee: configuredShipping.pickupFee, days: configuredShipping.pickupDays },
  }
  const shipping = shippingOptions[checkoutData.shippingMethod]
  const shippingFee = roundMoney(shipping.fee)
  const total = roundMoney(subtotal + shippingFee)
  if (total <= 0) throw new AppError('Order total must be greater than zero', 422)
  const estimatedDelivery = new Date(Date.now() + shipping.days * 86400000)
  return {
    items, shippingAddress: checkoutData.shippingAddress, billingAddress: checkoutData.billingAddress,
    shippingMethod: checkoutData.shippingMethod, shippingLabel: shipping.label,
    subtotal, shippingFee, total, estimatedDelivery,
  }
}

async function nextOrderNumber() {
  const year = new Date().getFullYear()
  const counter = await Counter.findOneAndUpdate({ _id: `orders-${year}` }, { $inc: { sequence: 1 } }, { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true })
  return `EDW-${year}-${String(counter.sequence).padStart(6, '0')}`
}

export async function releaseInventory() {}

export async function createOrderFromQuote({ user, quote, paymentMethod, paymentSlip = null, paymentReference = '' }) {
  const isBankTransfer = paymentMethod === 'Bank Transfer'
  const payment = isBankTransfer
    ? { provider: 'bank_transfer', currency: 'LKR', amount: quote.total, reference: paymentReference, slip: paymentSlip, submittedAt: new Date() }
    : { provider: 'cod', currency: 'LKR', amount: quote.total }
  const note = paymentMethod === 'COD'
    ? 'Order placed with Cash on Delivery'
    : 'Bank transfer slip submitted and awaiting administrator verification'
  const order = new Order({
    orderNumber: await nextOrderNumber(), user: user._id, items: quote.items,
    shippingAddress: quote.shippingAddress, billingAddress: quote.billingAddress,
    subtotal: quote.subtotal, shippingFee: quote.shippingFee, discount: 0, total: quote.total,
    shippingMethod: quote.shippingMethod, estimatedDelivery: quote.estimatedDelivery,
    paymentMethod, paymentStatus: isBankTransfer ? 'Slip Submitted' : 'Pending', orderStatus: 'Pending',
    payment,
    timeline: [{ status: 'Pending', timestamp: new Date(), note, updatedBy: user._id }],
  })
  await order.save()
  await Cart.updateOne({ user: user._id }, { $set: { items: [], subtotal: 0 } })
  return { order, duplicate: false }
}

export const publicQuote = (quote) => ({
  items: quote.items, shippingMethod: quote.shippingMethod, shippingLabel: quote.shippingLabel,
  subtotal: quote.subtotal, shippingFee: quote.shippingFee, total: quote.total, estimatedDelivery: quote.estimatedDelivery,
})
