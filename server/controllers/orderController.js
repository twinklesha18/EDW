import { env } from '../config/env.js'
import Order, { ORDER_STATUSES } from '../models/Order.js'
import { orderStatusEmail } from '../services/emailTemplates.js'
import { sendEmailSafely } from '../services/emailService.js'
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
  const order = await Order.findById(request.params.id).populate('user', 'firstName lastName email phone').populate('items.product', 'name slug image prices')
  if (!order) throw new AppError('Order not found', 404)
  return sendSuccess(response, { message: 'Order retrieved', data: { order } })
}

const trackingNumber = () => `EDW-TRK-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`

export async function updateOrder(request, response) {
  const order = await Order.findById(request.params.id).populate('user', 'firstName lastName email phone')
  if (!order) throw new AppError('Order not found', 404)
  const nextStatus = request.validatedBody.orderStatus
  if (nextStatus && nextStatus !== order.orderStatus) {
    const currentIndex = ORDER_STATUSES.indexOf(order.orderStatus), nextIndex = ORDER_STATUSES.indexOf(nextStatus)
    const isCancellation = nextStatus === 'Cancelled' && !['Delivered', 'Cancelled'].includes(order.orderStatus)
    if (!isCancellation && (['Delivered', 'Cancelled'].includes(order.orderStatus) || nextIndex <= currentIndex)) throw new AppError('Order status cannot move backwards or change after completion', 409)
    order.orderStatus = nextStatus
    order.timeline.push({ status: nextStatus, timestamp: new Date(), note: request.validatedBody.notes || `Order marked as ${nextStatus}`, updatedBy: request.user._id })
    if (nextStatus === 'Shipped' && !request.validatedBody.trackingNumber && !order.trackingNumber) order.trackingNumber = trackingNumber()
  }
  if (request.validatedBody.paymentStatus) order.paymentStatus = request.validatedBody.paymentStatus
  if (nextStatus === 'Delivered' && order.paymentMethod === 'COD') { order.paymentStatus = 'Paid'; order.payment.paidAt = new Date() }
  if (request.validatedBody.trackingNumber) order.trackingNumber = request.validatedBody.trackingNumber
  order.notes = request.validatedBody.notes
  await order.save()
  if (order.user && nextStatus && ['Shipped', 'Delivered'].includes(nextStatus)) void sendEmailSafely({ to: order.user.email, ...orderStatusEmail(order.user, order, env.clientOrigins[0]) })
  return sendSuccess(response, { message: 'Order updated successfully', data: { order } })
}
