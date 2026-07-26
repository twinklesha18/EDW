import Order from '../models/Order.js'
import { streamInvoice } from '../services/invoiceService.js'
import { AppError } from '../utils/responseUtils.js'
import { getResolvedSiteSettings } from '../services/siteSettingsService.js'
import { fetchInvoiceLogo } from '../services/invoiceBrandingService.js'

async function invoiceBranding() {
  const settings = await getResolvedSiteSettings()
  const logo = await fetchInvoiceLogo(settings.business?.logo?.url)
  return { settings, logo }
}

export async function downloadCustomerInvoice(request, response) {
  const order = await Order.findOne({ orderNumber: request.params.orderNumber.toUpperCase(), user: request.user._id }).populate('user', 'firstName lastName email phone')
  if (!order) throw new AppError('Order not found', 404)
  if (order.orderStatus === 'Cancelled') throw new AppError('Invoices are not available for cancelled orders', 409)
  if (order.orderStatus !== 'Delivered') throw new AppError('Your invoice will be available after the order is delivered', 409)
  const { settings, logo } = await invoiceBranding()
  streamInvoice(order, response, settings, logo)
}

export async function downloadAdminInvoice(request, response) {
  const order = await Order.findById(request.params.id).populate('user', 'firstName lastName email phone')
  if (!order) throw new AppError('Order not found', 404)
  if (order.orderStatus === 'Cancelled') throw new AppError('Invoices are not available for cancelled orders', 409)
  const { settings, logo } = await invoiceBranding()
  streamInvoice(order, response, settings, logo)
}
