import Order from '../models/Order.js'
import { streamInvoice } from '../services/invoiceService.js'
import { AppError } from '../utils/responseUtils.js'
import { getResolvedSiteSettings } from '../services/siteSettingsService.js'

async function invoiceBranding() {
  const settings = await getResolvedSiteSettings()
  let logo = null
  if (settings.business?.logo?.url) {
    try {
      const response = await fetch(settings.business.logo.url, { signal: AbortSignal.timeout(5000) })
      if (response.ok && Number(response.headers.get('content-length') || 0) <= 5 * 1024 * 1024) logo = Buffer.from(await response.arrayBuffer())
    } catch { /* The bundled logo remains the safe fallback. */ }
  }
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
