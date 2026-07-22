import Cart from '../models/Cart.js'
import Order from '../models/Order.js'
import Product from '../models/Product.js'
import Review from '../models/Review.js'
import { createCartSignature, recalculateCart } from '../utils/cartUtils.js'
import { escapeRegex, paginationData, paginationFromQuery } from '../utils/queryUtils.js'
import { releaseInventory } from '../services/checkoutService.js'
import { AppError, sendSuccess } from '../utils/responseUtils.js'
import { getBankTransferConfig } from '../config/bankTransfer.js'
import { deleteImage, uploadImage } from '../utils/cloudinaryUtils.js'
import { notifyNormalOrderAdminEvent, notifyNormalOrderPayment, notifyNormalOrderStatus } from '../services/orderNotificationService.js'

const orderPopulate = [{ path: 'items.product', select: 'name slug image prices' }, { path: 'user', select: 'firstName lastName email phone' }]
const absoluteImage = (request, image) => image.url.startsWith('/') ? { ...image, url: `${request.protocol}://${request.get('host')}${image.url}` } : image

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
  const productIds = order.items.map((item) => item.product?._id || item.product).filter(Boolean)
  const customerReviews = await Review.find({ user: request.user._id, product: { $in: productIds } }).select('product order rating title comment isApproved isVisible createdAt updatedAt').lean()
  return sendSuccess(response, { message: 'Order retrieved', data: { order: { ...order.toObject(), customerReviews } } })
}

export async function trackOrder(request, response) {
  const order = await Order.findOne({ orderNumber: request.validatedBody.orderNumber }).populate('user', 'email')
  if (!order || order.user?.email.toLowerCase() !== request.validatedBody.email) throw new AppError('No matching order was found', 404)
  return sendSuccess(response, { message: 'Tracking information retrieved', data: { order: { orderNumber: order.orderNumber, orderStatus: order.orderStatus, paymentStatus: order.paymentStatus, trackingNumber: order.trackingNumber, estimatedDelivery: order.estimatedDelivery, timeline: order.timeline, createdAt: order.createdAt } } })
}

export async function cancelCustomerOrder(request, response) {
  const cancelledAt = new Date()
  const order = await Order.findOneAndUpdate(
    { orderNumber: request.params.orderNumber.toUpperCase(), user: request.user._id, orderStatus: 'Pending' },
    {
      $set: {
        orderStatus: 'Cancelled',
        cancellation: { reason: request.validatedBody.reason, cancelledBy: request.user._id, cancelledByRole: 'customer', cancelledAt },
      },
      $push: { timeline: { status: 'Cancelled', timestamp: cancelledAt, note: 'Cancelled by customer', updatedBy: request.user._id } },
    },
    { returnDocument: 'after' },
  )
  if (!order) throw new AppError('Only pending orders can be cancelled', 409)
  await releaseInventory(order.items)
  if (order.paymentMethod === 'Bank Transfer' && order.paymentStatus === 'Paid') {
    order.refunds.push({ amount: order.total, reason: 'Customer cancelled pending order', status: 'Pending' })
    await order.save()
  }
  await Promise.all([
    notifyNormalOrderStatus(order, request.user),
    notifyNormalOrderAdminEvent(order, `Order ${order.orderNumber} cancelled`, `${request.user.firstName} ${request.user.lastName} cancelled the order. Reason: ${request.validatedBody.reason}`),
  ])
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

export async function resubmitBankTransferSlip(request, response) {
  const order = await Order.findOne({ orderNumber: request.params.orderNumber.toUpperCase(), user: request.user._id })
  if (!order) throw new AppError('Order not found', 404)
  if (order.paymentMethod !== 'Bank Transfer' || order.paymentStatus !== 'Payment Rejected' || order.orderStatus !== 'Pending') throw new AppError('A payment slip can be resubmitted only for a rejected pending bank-transfer order', 409)
  if (!(await getBankTransferConfig()).available) throw new AppError('Bank transfer is currently unavailable', 503)
  let paymentSlip = null
  const oldPublicId = order.payment?.slip?.publicId
  try {
    paymentSlip = absoluteImage(request, await uploadImage(request.file, 'eshaz-dream-world/payment-slips'))
    order.payment.slip = paymentSlip
    order.payment.reference = request.validatedBody.paymentReference
    order.payment.submittedAt = new Date()
    order.payment.verifiedAt = null
    order.payment.reviewNote = ''
    order.paymentStatus = 'Slip Submitted'
    await order.save()
    if (oldPublicId && oldPublicId !== paymentSlip.publicId) await deleteImage(oldPublicId).catch(() => {})
    await Promise.all([
      notifyNormalOrderPayment(order, request.user, 'Your replacement payment slip was submitted for verification.'),
      notifyNormalOrderAdminEvent(order, `Payment slip resubmitted for ${order.orderNumber}`, `${request.user.firstName} ${request.user.lastName} uploaded a replacement bank-transfer slip.`),
    ])
    return sendSuccess(response, { message: 'Replacement payment slip submitted for verification', data: { order } })
  } catch (error) {
    if (paymentSlip?.publicId) await deleteImage(paymentSlip.publicId).catch(() => {})
    throw error
  }
}
