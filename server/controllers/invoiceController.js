import Order from '../models/Order.js'
import { streamInvoice } from '../services/invoiceService.js'
import { AppError } from '../utils/responseUtils.js'

export async function downloadCustomerInvoice(request, response) {
  const order = await Order.findOne({ orderNumber: request.params.orderNumber.toUpperCase(), user: request.user._id }).populate('user', 'firstName lastName email phone')
  if (!order) throw new AppError('Order not found', 404)
  streamInvoice(order, response)
}

export async function downloadAdminInvoice(request, response) {
  const order = await Order.findById(request.params.id).populate('user', 'firstName lastName email phone')
  if (!order) throw new AppError('Order not found', 404)
  streamInvoice(order, response)
}
