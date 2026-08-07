import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import mongoose from 'mongoose'
import { env } from '../config/env.js'
import { isCloudinaryConfigured } from '../config/cloudinary.js'
import CustomOrder from '../models/CustomOrder.js'
import Order from '../models/Order.js'
import { deleteImage, uploadImage } from '../utils/cloudinaryUtils.js'

const applyChanges = process.argv.includes('--apply')
const currentDirectory = path.dirname(fileURLToPath(import.meta.url))
const paymentSlipDirectory = path.resolve(currentDirectory, '..', 'uploads', 'payment-slips')
const localIdPattern = /^local:payment-slips\/([a-zA-Z0-9-]+\.(?:jpe?g|png|webp|avif))$/
const imageMimeType = (filename) => ({
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
}[path.extname(filename).toLowerCase()] || '')
const connectionUri = process.env.MONGODB_MIGRATION_URI?.trim() || env.mongoUri

const atlasHosts = (() => {
  if (connectionUri.startsWith('mongodb+srv://')) {
    try {
      return [new URL(connectionUri).hostname]
    } catch {
      return []
    }
  }
  const authority = connectionUri.match(/^mongodb:\/\/(?:[^@]+@)?([^/]+)/)?.[1] || ''
  return authority.split(',').map((entry) => entry.trim().replace(/:\d+$/, '')).filter(Boolean)
})()

if (!atlasHosts.length || !atlasHosts.every((host) => host.endsWith('.mongodb.net'))) {
  throw new Error('Legacy payment-slip migration is restricted to a MongoDB Atlas connection')
}
if (!isCloudinaryConfigured) {
  throw new Error('Cloudinary environment variables are required for payment-slip migration')
}

const migrate = async ({ model, document, field, reference, publicId }) => {
  const match = String(publicId || '').match(localIdPattern)
  if (!match) return false
  const filename = match[1]
  const sourcePath = path.resolve(paymentSlipDirectory, filename)
  if (!sourcePath.startsWith(`${paymentSlipDirectory}${path.sep}`)) throw new Error(`Invalid legacy slip path for ${reference}`)
  if (!applyChanges) {
    console.log(`[dry-run] ${reference}: ${filename}`)
    return true
  }

  const buffer = await readFile(sourcePath)
  const uploaded = await uploadImage({ buffer, originalname: filename, mimetype: imageMimeType(filename) }, 'eshaz-dream-world/payment-slips')
  const result = await model.updateOne(
    { _id: document._id, [`${field}.publicId`]: publicId },
    { $set: { [field]: uploaded } },
  )
  if (result.modifiedCount !== 1) {
    await deleteImage(uploaded.publicId).catch(() => {})
    throw new Error(`The database record changed while migrating ${reference}`)
  }
  console.log(`[migrated] ${reference}`)
  return true
}

await mongoose.connect(connectionUri)
try {
  const [orders, customOrders] = await Promise.all([
    Order.find({ 'payment.slip.publicId': { $regex: '^local:payment-slips/' } }).select('orderNumber payment.slip.publicId').lean(),
    CustomOrder.find({ 'paymentSlip.publicId': { $regex: '^local:payment-slips/' } }).select('requestNumber paymentSlip.publicId').lean(),
  ])
  let count = 0
  for (const order of orders) {
    if (await migrate({ model: Order, document: order, field: 'payment.slip', reference: order.orderNumber, publicId: order.payment?.slip?.publicId })) count += 1
  }
  for (const customOrder of customOrders) {
    if (await migrate({ model: CustomOrder, document: customOrder, field: 'paymentSlip', reference: customOrder.requestNumber, publicId: customOrder.paymentSlip?.publicId })) count += 1
  }
  console.log(`${applyChanges ? 'Migrated' : 'Found'} ${count} legacy payment slip(s).${applyChanges ? '' : ' Run with --apply to migrate them.'}`)
} finally {
  await mongoose.disconnect()
}
