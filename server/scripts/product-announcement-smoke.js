import assert from 'node:assert/strict'
import mongoose from 'mongoose'

process.env.EDW_DISABLE_EMAIL = 'true'
import { env } from '../config/env.js'
import User from '../models/User.js'
import { newProductAnnouncementEmail } from '../services/emailTemplates.js'
import { announceNewProduct, batchProductAnnouncementRecipients, listProductAnnouncementRecipients } from '../services/productAnnouncementService.js'

const suffix = Date.now()
const password = 'AnnouncementSecure1'
const customerEmail = `announcement-customer-${suffix}@edw.test`
const inactiveEmail = `announcement-inactive-${suffix}@edw.test`
const adminEmail = `announcement-admin-${suffix}@edw.test`
let customer
let inactiveCustomer
let admin

try {
  await mongoose.connect(env.mongoUri)
  ;[customer, inactiveCustomer, admin] = await User.create([
    { firstName: 'Announcement', lastName: 'Customer', email: customerEmail, phone: '0759011001', password, role: 'user', isActive: true },
    { firstName: 'Inactive', lastName: 'Customer', email: inactiveEmail, phone: '0759011002', password, role: 'user', isActive: false },
    { firstName: 'Announcement', lastName: 'Admin', email: adminEmail, phone: '0759011003', password, role: 'admin', isActive: true },
  ])

  const eligible = await listProductAnnouncementRecipients()
  const eligibleIds = new Set(eligible.map((entry) => String(entry._id)))
  assert.ok(eligibleIds.has(String(customer._id)), 'An active registered customer is included')
  assert.ok(!eligibleIds.has(String(inactiveCustomer._id)), 'An inactive customer is excluded')
  assert.ok(!eligibleIds.has(String(admin._id)), 'An administrator is excluded')

  const batches = batchProductAnnouncementRecipients(Array.from({ length: 101 }, (_, index) => `customer-${index}@edw.test`))
  assert.deepEqual(batches.map((batch) => batch.length), [50, 50, 1], 'Recipients are split into privacy-safe provider batches')

  const product = {
    name: 'New Product Announcement Test',
    slug: `new-product-announcement-${suffix}`,
    category: { name: 'Bouquets' },
    prices: { S: 1500, M: 2000, L: 2500 },
  }
  const email = newProductAnnouncementEmail(product, env.clientUrl)
  assert.match(email.subject, /New Product Announcement Test/)
  assert.match(email.html, new RegExp(`${env.clientUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/product/${product.slug}`))
  assert.match(email.html, /LKR/)

  const delivery = await announceNewProduct(product)
  assert.equal(delivery.recipients, eligible.length)
  assert.equal(delivery.batches, Math.ceil(eligible.length / 50))
  assert.equal(delivery.failedBatches, 0)
  assert.equal(delivery.skippedBatches, delivery.batches, 'Smoke tests never contact the email provider')

  console.log('Product announcement smoke test passed: active customers only, administrators excluded, private batching, product content, and safe email delivery.')
} finally {
  await User.deleteMany({ email: { $in: [customerEmail, inactiveEmail, adminEmail] } })
  await mongoose.disconnect()
}
