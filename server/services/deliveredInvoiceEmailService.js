import User from '../models/User.js'
import { env } from '../config/env.js'
import { deliveredInvoiceEmail } from './emailTemplates.js'
import { canDeliverEmail, sendEmailSafely } from './emailService.js'
import { fetchInvoiceLogo } from './invoiceBrandingService.js'
import { createInvoiceBuffer } from './invoiceService.js'
import { getResolvedSiteSettings } from './siteSettingsService.js'

export async function createDeliveredInvoiceEmailPayload(order, recipient, settings, logo = null) {
  const invoice = await createInvoiceBuffer(order, settings, logo)
  return {
    ...deliveredInvoiceEmail(recipient, order, env.clientUrl),
    attachments: [{
      filename: `${order.orderNumber}-invoice.pdf`,
      content: invoice,
      contentType: 'application/pdf',
      contentDisposition: 'attachment',
    }],
  }
}

export async function sendDeliveredInvoiceEmailSafely(order, user) {
  try {
    const recipient = typeof user?.isActive === 'boolean' && user.email
      ? user
      : await User.findById(user?._id || user).select('firstName email isActive')
    if (!recipient?.isActive || !canDeliverEmail(recipient.email)) return { skipped: true }
    const settings = await getResolvedSiteSettings()
    const logo = await fetchInvoiceLogo(settings.business?.logo?.url)
    return sendEmailSafely({
      to: recipient.email,
      ...await createDeliveredInvoiceEmailPayload(order, recipient, settings, logo),
    })
  } catch (error) {
    console.error(`Delivered invoice email failed: ${error.message}`)
    return { failed: true }
  }
}
