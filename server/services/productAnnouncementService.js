import { env } from '../config/env.js'
import User from '../models/User.js'
import { newProductAnnouncementEmail } from './emailTemplates.js'
import { sendEmailSafely } from './emailService.js'

const recipientBatchSize = 50

export function batchProductAnnouncementRecipients(recipients, size = recipientBatchSize) {
  const batches = []
  for (let index = 0; index < recipients.length; index += size) batches.push(recipients.slice(index, index + size))
  return batches
}

export function listProductAnnouncementRecipients() {
  return User.find({ role: 'user', isActive: true }).select('_id email').lean()
}

export async function announceNewProduct(product) {
  const customers = await listProductAnnouncementRecipients()
  const recipients = customers.map((customer) => customer.email).filter(Boolean)
  const batches = batchProductAnnouncementRecipients(recipients)
  const email = newProductAnnouncementEmail(product, env.clientUrl)
  const deliveries = []

  for (const bcc of batches) deliveries.push(await sendEmailSafely({ bcc, ...email }))

  return {
    recipients: recipients.length,
    batches: batches.length,
    failedBatches: deliveries.filter((delivery) => delivery?.failed).length,
    skippedBatches: deliveries.filter((delivery) => delivery?.skipped).length,
  }
}

export async function announceNewProductSafely(product) {
  try { return await announceNewProduct(product) }
  catch (error) {
    console.error(`New-product announcement failed: ${error.message}`)
    return { recipients: 0, batches: 0, failedBatches: 1, skippedBatches: 0 }
  }
}
