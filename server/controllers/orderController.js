import Order, { ORDER_STATUSES } from '../models/Order.js'
import User from '../models/User.js'
import { notifyNormalOrderPayment, notifyNormalOrderStatus, notifyNormalOrderTracking } from '../services/orderNotificationService.js'
import { escapeRegex, paginationData, paginationFromQuery } from '../utils/queryUtils.js'
import { AppError, sendSuccess } from '../utils/responseUtils.js'

export async function listOrders(request, response) {
  const { page, limit, skip } = paginationFromQuery(request.query, { defaultLimit: 10 })
  const filter = {}
  if (request.query.search) filter.orderNumber = new RegExp(escapeRegex(request.query.search), 'i')
  if (request.query.status) filter.orderStatus = request.query.status
  if (request.query.payment) filter.paymentStatus = request.query.payment
  const [orders, total] = await Promise.all([Order.find(filter).populate('user', 'firstName lastName email phone').sort({ createdAt: -1 }).skip(skip).limit(limit), Order.countDocuments(filter)])
  return sendSuccess(response, { message: 'Orders retrieved', data: { orders, pagination: paginationData(total, page, limit) } })
}

export async function getOrder(request, response) {
  const order = await Order.findById(request.params.id).populate('user', 'firstName lastName email phone').populate('items.product', 'name slug image prices').populate('cancellation.cancelledBy', 'firstName lastName email role')
  if (!order) throw new AppError('Order not found', 404)
  return sendSuccess(response, { message: 'Order retrieved', data: { order } })
}

export async function listCancelledOrders(request, response) {
  const { page, limit, skip } = paginationFromQuery(request.query, { defaultLimit: 10 })
  const filter = { orderStatus: 'Cancelled' }
  if (request.query.search) {
    const pattern = new RegExp(escapeRegex(String(request.query.search).slice(0, 100)), 'i')
    const customers = await User.find({ $or: [{ firstName: pattern }, { lastName: pattern }, { email: pattern }] }).select('_id')
    filter.$or = [{ orderNumber: pattern }, { 'cancellation.reason': pattern }, { 'items.name': pattern }, { user: { $in: customers.map((customer) => customer._id) } }]
  }
  const [orders, total] = await Promise.all([
    Order.find(filter)
      .populate('user', 'firstName lastName email phone')
      .populate('cancellation.cancelledBy', 'firstName lastName email role')
      .sort({ 'cancellation.cancelledAt': -1, updatedAt: -1 })
      .skip(skip)
      .limit(limit),
    Order.countDocuments(filter),
  ])
  return sendSuccess(response, { message: 'Cancelled orders retrieved', data: { orders, pagination: paginationData(total, page, limit) } })
}

const trackingNumber = () => `EDW-TRK-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`

export async function updateOrder(request, response) {
  const order = await Order.findById(request.params.id).populate('user', 'firstName lastName email phone')
  if (!order) throw new AppError('Order not found', 404)
  const previousStatus = order.orderStatus
  const previousPaymentStatus = order.paymentStatus
  const previousTrackingNumber = order.trackingNumber
  const nextStatus = request.validatedBody.orderStatus
  if (nextStatus && nextStatus !== order.orderStatus) {
    if (order.paymentMethod === 'Bank Transfer' && order.paymentStatus !== 'Paid' && !['Pending', 'Cancelled'].includes(nextStatus)) throw new AppError('Approve the submitted bank payment slip before progressing this order', 409)
    const currentIndex = ORDER_STATUSES.indexOf(order.orderStatus), nextIndex = ORDER_STATUSES.indexOf(nextStatus)
    const isCancellation = nextStatus === 'Cancelled' && !['Delivered', 'Cancelled'].includes(order.orderStatus)
    if (!isCancellation && (['Delivered', 'Cancelled'].includes(order.orderStatus) || nextIndex <= currentIndex)) throw new AppError('Order status cannot move backwards or change after completion', 409)
    order.orderStatus = nextStatus
    order.timeline.push({ status: nextStatus, timestamp: new Date(), note: request.validatedBody.notes || `Order marked as ${nextStatus}`, updatedBy: request.user._id })
    if (nextStatus === 'Cancelled') {
      order.cancellation = { reason: request.validatedBody.notes, cancelledBy: request.user._id, cancelledByRole: 'admin', cancelledAt: new Date() }
    }
    if (nextStatus === 'Shipped' && !request.validatedBody.trackingNumber && !order.trackingNumber) order.trackingNumber = trackingNumber()
  }
  if (request.validatedBody.paymentStatus) {
    if (order.paymentMethod === 'Bank Transfer') throw new AppError('Use the bank payment review controls to update this payment', 409)
    order.paymentStatus = request.validatedBody.paymentStatus
  }
  if (nextStatus === 'Delivered' && order.paymentMethod === 'COD') { order.paymentStatus = 'Paid'; order.payment.paidAt = new Date() }
  if (request.validatedBody.trackingNumber) order.trackingNumber = request.validatedBody.trackingNumber
  order.notes = request.validatedBody.notes
  await order.save()
  if (order.user && order.orderStatus !== previousStatus) await notifyNormalOrderStatus(order, order.user)
  if (order.user && order.paymentStatus !== previousPaymentStatus && !(order.orderStatus === 'Delivered' && order.paymentMethod === 'COD')) await notifyNormalOrderPayment(order, order.user)
  if (order.user && order.trackingNumber && order.trackingNumber !== previousTrackingNumber && order.orderStatus === previousStatus) await notifyNormalOrderTracking(order, order.user)
  return sendSuccess(response, { message: 'Order updated successfully', data: { order } })
}

export async function reviewOrderPayment(request, response) {
  const order = await Order.findById(request.params.id).populate('user', 'firstName lastName email phone')
  if (!order) throw new AppError('Order not found', 404)
  const { action, note } = request.validatedBody
  if (action === 'collect-cod') {
    if (order.paymentMethod !== 'COD' || order.paymentStatus !== 'Pending') throw new AppError('This order is not awaiting Cash on Delivery collection', 409)
    order.paymentStatus = 'Paid'
    order.payment.paidAt = new Date()
    order.payment.verifiedAt = new Date()
    order.payment.reviewNote = note || 'Cash on Delivery payment collected'
  } else {
    if (order.paymentMethod !== 'Bank Transfer' || order.paymentStatus !== 'Slip Submitted' || !order.payment?.slip?.url) throw new AppError('There is no submitted bank payment slip awaiting review', 409)
    order.payment.reviewNote = note
    if (action === 'approve') {
      order.paymentStatus = 'Paid'
      order.payment.paidAt = new Date()
      order.payment.verifiedAt = new Date()
    } else {
      order.paymentStatus = 'Payment Rejected'
      order.payment.verifiedAt = null
    }
  }
  await order.save()
  if (order.user) await notifyNormalOrderPayment(order, order.user, order.payment.reviewNote)
  return sendSuccess(response, { message: 'Order payment updated successfully', data: { order } })
}
