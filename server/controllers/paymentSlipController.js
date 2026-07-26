import { timingSafeEqual } from 'node:crypto'
import CustomOrder from '../models/CustomOrder.js'
import Order from '../models/Order.js'
import { loadPaymentSlip } from '../services/paymentSlipService.js'
import { deleteImage, uploadImage } from '../utils/cloudinaryUtils.js'
import { AppError, sendSuccess } from '../utils/responseUtils.js'

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

export async function viewCustomerOrderPaymentSlip(request, response) {
  const order = await Order.findOne({
    orderNumber: request.params.orderNumber.toUpperCase(),
    user: request.user._id,
  }).select('orderNumber paymentMethod payment.slip.url')
  if (!order) throw new AppError('Order not found', 404)
  if (order.paymentMethod !== 'Bank Transfer') throw new AppError('This order does not use a bank payment slip', 409)
  return sendSlip(response, order.payment?.slip?.url, `${order.orderNumber}-payment-slip`)
}

export async function viewCustomerCustomOrderPaymentSlip(request, response) {
  const customOrder = await CustomOrder.findOne({
    _id: request.params.id,
    user: request.user._id,
  }).select('requestNumber paymentMethod paymentSlip.url')
  if (!customOrder) throw new AppError('Custom order not found', 404)
  if (customOrder.paymentMethod !== 'Bank Transfer') throw new AppError('This custom order does not use a bank payment slip', 409)
  return sendSlip(response, customOrder.paymentSlip?.url, `${customOrder.requestNumber}-payment-slip`)
}

const replaceSlip = async ({ request, response, document, field, reference }) => {
  if (!request.file) throw new AppError('Select a payment slip image to upload', 422)
  if (document.paymentMethod !== 'Bank Transfer') throw new AppError('This order does not use a bank payment slip', 409)
  const currentSlip = field === 'payment.slip' ? document.payment?.slip : document.paymentSlip
  let uploaded
  try {
    uploaded = await uploadImage(request.file, 'eshaz-dream-world/payment-slips')
    if (field === 'payment.slip') document.payment.slip = uploaded
    else document.paymentSlip = uploaded
    await document.save()
    if (currentSlip?.publicId && currentSlip.publicId !== uploaded.publicId) await deleteImage(currentSlip.publicId).catch(() => {})
    return sendSuccess(response, { message: `Payment slip restored for ${reference}`, data: { paymentSlip: uploaded } })
  } catch (error) {
    if (uploaded?.publicId) await deleteImage(uploaded.publicId).catch(() => {})
    throw error
  }
}

export async function replaceAdminOrderPaymentSlip(request, response) {
  const order = await Order.findById(request.params.id)
  if (!order) throw new AppError('Order not found', 404)
  return replaceSlip({ request, response, document: order, field: 'payment.slip', reference: order.orderNumber })
}

export async function replaceAdminCustomOrderPaymentSlip(request, response) {
  const customOrder = await CustomOrder.findById(request.params.id)
  if (!customOrder) throw new AppError('Custom order not found', 404)
  return replaceSlip({ request, response, document: customOrder, field: 'paymentSlip', reference: customOrder.requestNumber })
}

export async function migrateLegacyPaymentSlip(request, response) {
  const expectedToken = String(process.env.PAYMENT_SLIP_MIGRATION_TOKEN || '').trim()
  const providedToken = String(request.get('x-migration-token') || '').trim()
  const expectedBuffer = Buffer.from(expectedToken)
  const providedBuffer = Buffer.from(providedToken)
  const authorized = expectedBuffer.length > 31
    && expectedBuffer.length === providedBuffer.length
    && timingSafeEqual(expectedBuffer, providedBuffer)
  if (!authorized) throw new AppError('Route not found', 404)
  if (!request.file) throw new AppError('Select the legacy payment slip image', 422)

  const orderNumber = String(request.body?.orderNumber || '').trim().toUpperCase()
  if (!/^EDW-\d{4}-\d{6}$/.test(orderNumber)) throw new AppError('A valid order number is required', 422)
  const order = await Order.findOne({ orderNumber })
  if (!order) throw new AppError('Order not found', 404)
  if (!String(order.payment?.slip?.publicId || '').startsWith('local:payment-slips/')) {
    throw new AppError('This payment slip is not a legacy local upload', 409)
  }
  return replaceSlip({ request, response, document: order, field: 'payment.slip', reference: order.orderNumber })
}
