import CustomOrder from '../models/CustomOrder.js'
import Order from '../models/Order.js'
import { loadPaymentSlip } from '../services/paymentSlipService.js'
import { AppError } from '../utils/responseUtils.js'

const sendSlip = async (response, url, filename) => {
  if (!url) throw new AppError('No payment slip was uploaded for this order', 404)
  const image = await loadPaymentSlip(url)
  if (!image) throw new AppError('The payment slip image is currently unavailable', 404)
  response
    .set('Content-Type', image.contentType)
    .set('Content-Disposition', `inline; filename="${filename}.png"`)
    .set('Cache-Control', 'private, max-age=300')
    .set('X-Content-Type-Options', 'nosniff')
    .status(200)
    .send(image.buffer)
}

export async function viewAdminOrderPaymentSlip(request, response) {
  const order = await Order.findById(request.params.id).select('orderNumber paymentMethod payment.slip.url')
  if (!order) throw new AppError('Order not found', 404)
  if (order.paymentMethod !== 'Bank Transfer') throw new AppError('This order does not use a bank payment slip', 409)
  return sendSlip(response, order.payment?.slip?.url, `${order.orderNumber}-payment-slip`)
}

export async function viewAdminCustomOrderPaymentSlip(request, response) {
  const customOrder = await CustomOrder.findById(request.params.id).select('requestNumber paymentMethod paymentSlip.url')
  if (!customOrder) throw new AppError('Custom order not found', 404)
  if (customOrder.paymentMethod !== 'Bank Transfer') throw new AppError('This custom order does not use a bank payment slip', 409)
  return sendSlip(response, customOrder.paymentSlip?.url, `${customOrder.requestNumber}-payment-slip`)
}
