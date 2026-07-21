import Cart from '../models/Cart.js'
import Order from '../models/Order.js'
import Product from '../models/Product.js'
import { createCartSignature, recalculateCart } from '../utils/cartUtils.js'
import { escapeRegex, paginationData, paginationFromQuery } from '../utils/queryUtils.js'
import { releaseCoupon, releaseInventory } from '../services/checkoutService.js'
import { AppError, sendSuccess } from '../utils/responseUtils.js'

const orderPopulate = [{ path: 'items.product', select: 'name slug image prices' }, { path: 'user', select: 'firstName lastName email phone' }]

export async function listCustomerOrders(request, response) {
  const { page, limit, skip } = paginationFromQuery(request.query, { defaultLimit: 8 })
  const filter = { user: request.user._id }
  if (request.query.status) filter.orderStatus = request.query.status
  if (request.query.search) filter.orderNumber = new RegExp(escapeRegex(String(request.query.search).slice(0, 40)), 'i')
  const [orders, total] = await Promise.all([Order.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit), Order.countDocuments(filter)])
  return sendSuccess(response, { message: 'Order history retrieved', data: { orders, pagination: paginationData(total, page, limit) } })
}

export async function getCustomerOrder(request, response) {
  const order = await Order.findOne({ orderNumber: request.params.orderNumber.toUpperCase(), user: request.user._id }).populate(orderPopulate)
  if (!order) throw new AppError('Order not found', 404)
  return sendSuccess(response, { message: 'Order retrieved', data: { order } })
}

export async function trackOrder(request, response) {
  const order = await Order.findOne({ orderNumber: request.validatedBody.orderNumber }).populate('user', 'email')
  if (!order || order.user?.email.toLowerCase() !== request.validatedBody.email) throw new AppError('No matching order was found', 404)
  return sendSuccess(response, { message: 'Tracking information retrieved', data: { order: { orderNumber: order.orderNumber, orderStatus: order.orderStatus, paymentStatus: order.paymentStatus, trackingNumber: order.trackingNumber, estimatedDelivery: order.estimatedDelivery, timeline: order.timeline, createdAt: order.createdAt } } })
}

export async function cancelCustomerOrder(request, response) {
  const order = await Order.findOneAndUpdate(
    { orderNumber: request.params.orderNumber.toUpperCase(), user: request.user._id, orderStatus: 'Pending' },
    { $set: { orderStatus: 'Cancelled' }, $push: { timeline: { status: 'Cancelled', timestamp: new Date(), note: 'Cancelled by customer', updatedBy: request.user._id } } },
    { returnDocument: 'after' },
  )
  if (!order) throw new AppError('Only pending orders can be cancelled', 409)
  await Promise.all([releaseInventory(order.items), releaseCoupon(order)])
  if (order.paymentMethod === 'Stripe' && order.paymentStatus === 'Paid') {
    order.refunds.push({ amount: order.total, reason: 'Customer cancelled pending order', status: 'Pending' })
    await order.save()
  }
  return sendSuccess(response, { message: 'Order cancelled successfully', data: { order } })
}

export async function reorderCustomerOrder(request, response) {
  const order = await Order.findOne({ orderNumber: request.params.orderNumber.toUpperCase(), user: request.user._id })
  if (!order) throw new AppError('Order not found', 404)
  const productIds = order.items.map((item) => item.product)
  const products = await Product.find({ _id: { $in: productIds } }).populate('category', 'name')
  const productMap = new Map(products.map((product) => [String(product._id), product]))
  const cart = await Cart.findOneAndUpdate({ user: request.user._id }, { $setOnInsert: { user: request.user._id, items: [], subtotal: 0 } }, { upsert: true, returnDocument: 'after' })
  let added = 0
  for (const oldItem of order.items) {
    const product = productMap.get(String(oldItem.product)); if (!product) continue
    const size = oldItem.size || 'M', quantity = Math.min(99, oldItem.quantity), customization = oldItem.customization || {}
    const signature = createCartSignature(String(product._id), size, customization), existing = cart.items.find((item) => item.signature === signature)
    if (existing) existing.quantity = Math.min(99, existing.quantity + quantity)
    else cart.items.push({ productId: String(product._id), signature, name: product.name, slug: product.slug, image: product.image.url, size, price: product.prices[size], quantity, category: product.category?.name || 'Uncategorized', customization })
    added += 1
  }
  if (!added) throw new AppError('No items from this order are currently available', 409)
  recalculateCart(cart); await cart.save()
  return sendSuccess(response, { message: `${added} product(s) added to your cart`, data: { cart } })
}
