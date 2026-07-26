import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import mongoose from 'mongoose'
import { env } from '../config/env.js'
import { isCloudinaryConfigured } from '../config/cloudinary.js'
import Category from '../models/Category.js'
import Product from '../models/Product.js'
import { deleteImage, uploadImage } from '../utils/cloudinaryUtils.js'

const applyChanges = process.argv.includes('--apply')
const currentDirectory = path.dirname(fileURLToPath(import.meta.url))
const uploadsRoot = path.resolve(currentDirectory, '..', 'uploads')
const connectionUri = process.env.MONGODB_MIGRATION_URI?.trim() || env.mongoUri
const localImagePattern = /^local:(products|categories)\/([a-zA-Z0-9-]+\.webp)$/

if (!/^mongodb\+srv:\/\//i.test(connectionUri)) {
  throw new Error('Catalog media migration is restricted to a MongoDB Atlas SRV connection')
}
if (!isCloudinaryConfigured) {
  throw new Error('Cloudinary environment variables are required for catalog media migration')
}

async function sourceFile(image, targetFolder) {
  const localMatch = String(image?.publicId || '').match(localImagePattern)
  if (localMatch) {
    const sourcePath = path.resolve(uploadsRoot, localMatch[1], localMatch[2])
    if (!sourcePath.startsWith(`${uploadsRoot}${path.sep}`)) throw new Error('Invalid legacy catalog image path')
    try {
      return { buffer: await readFile(sourcePath), originalname: localMatch[2], mimetype: 'image/webp' }
    } catch (error) {
      if (error.code !== 'ENOENT') throw error
    }
  }

  const url = String(image?.url || '')
  if (!/^https:\/\/edw-jvpw\.vercel\.app\/uploads\/(products|categories)\/[a-zA-Z0-9-]+\.webp$/i.test(url)) {
    throw new Error(`No safe legacy source is available for ${targetFolder}`)
  }
  const response = await fetch(url, { signal: AbortSignal.timeout(20_000) })
  if (!response.ok) throw new Error(`Legacy media returned HTTP ${response.status}`)
  const contentType = response.headers.get('content-type') || ''
  const contentLength = Number(response.headers.get('content-length') || 0)
  if (!contentType.startsWith('image/') || contentLength > 12 * 1024 * 1024) throw new Error('Legacy media response is not a valid image')
  const buffer = Buffer.from(await response.arrayBuffer())
  if (buffer.length > 12 * 1024 * 1024) throw new Error('Legacy media exceeds the 12 MB limit')
  return { buffer, originalname: path.basename(new URL(url).pathname), mimetype: contentType }
}

async function migrateDocument({ model, document, folder, reference }) {
  const image = document.image
  if (!image?.url) return false
  if (!applyChanges) {
    console.log(`[dry-run] ${reference}`)
    return true
  }

  const file = await sourceFile(image, folder)
  const uploaded = await uploadImage(file, `eshaz-dream-world/${folder}`)
  const nextImage = { ...uploaded, ...(image.alt ? { alt: image.alt } : {}) }
  const result = await model.updateOne(
    { _id: document._id, 'image.url': image.url },
    { $set: { image: nextImage } },
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
  const legacyFilter = {
    $or: [
      { 'image.publicId': { $regex: '^local:(products|categories)/' } },
      { 'image.url': { $regex: '^https://edw-jvpw\\.vercel\\.app/uploads/(products|categories)/' } },
      { 'image.url': { $regex: '^/uploads/(products|categories)/' } },
    ],
  }
  const [products, categories] = await Promise.all([
    Product.find(legacyFilter).select('name image').lean(),
    Category.find(legacyFilter).select('name image').lean(),
  ])
  let count = 0
  for (const product of products) {
    if (await migrateDocument({ model: Product, document: product, folder: 'products', reference: `Product: ${product.name}` })) count += 1
  }
  for (const category of categories) {
    if (await migrateDocument({ model: Category, document: category, folder: 'categories', reference: `Category: ${category.name}` })) count += 1
  }
  console.log(`${applyChanges ? 'Migrated' : 'Found'} ${count} legacy catalog image(s).${applyChanges ? '' : ' Run with --apply to migrate them.'}`)
} finally {
  await mongoose.disconnect()
}

