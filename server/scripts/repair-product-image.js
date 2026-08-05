import { readFile } from 'node:fs/promises'
import path from 'node:path'
import dotenv from 'dotenv'
import mongoose from 'mongoose'

const argumentsMap = new Map()
for (let index = 2; index < process.argv.length; index += 2) argumentsMap.set(process.argv[index], process.argv[index + 1] || '')

const environmentFile = process.env.EDW_ENV_FILE
if (environmentFile) dotenv.config({ path: environmentFile, override: true, quiet: true })
else dotenv.config({ quiet: true })

const slug = String(argumentsMap.get('--slug') || '').trim().toLowerCase()
const sourcePath = path.resolve(String(argumentsMap.get('--file') || ''))
const confirmed = argumentsMap.has('--confirm-production-repair')
if (!slug || !argumentsMap.get('--file') || !confirmed) {
  throw new Error('Usage: npm run repair:product-image -- --slug <slug> --file <image-path> --confirm-production-repair yes')
}

const [{ env }, { default: Product }, { uploadImage, deleteImage }] = await Promise.all([
  import('../config/env.js'),
  import('../models/Product.js'),
  import('../utils/cloudinaryUtils.js'),
])

let uploaded
try {
  await mongoose.connect(env.mongoUri)
  const product = await Product.findOne({ slug })
  if (!product) throw new Error(`Product not found: ${slug}`)

  const currentResponse = await fetch(product.image.url, { method: 'HEAD' }).catch(() => null)
  if (currentResponse?.ok) throw new Error('The current product image is available; repair was stopped to avoid overwriting it')

  const buffer = await readFile(sourcePath)
  uploaded = await uploadImage({ buffer, mimetype: 'image/jpeg', originalname: path.basename(sourcePath) }, 'eshaz-dream-world/products')
  const previousPublicId = product.image?.publicId
  product.image = { ...uploaded, alt: product.name }
  await product.save()
  if (previousPublicId && previousPublicId !== uploaded.publicId) await deleteImage(previousPublicId).catch(() => {})

  console.log(`Repaired product image: ${product.slug}`)
  console.log(`New image URL: ${uploaded.url}`)
} catch (error) {
  if (uploaded?.publicId) await deleteImage(uploaded.publicId).catch(() => {})
  throw error
} finally {
  await mongoose.disconnect()
}
