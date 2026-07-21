import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import mongoose from 'mongoose'
import { env } from '../config/env.js'
import Category from '../models/Category.js'
import Product from '../models/Product.js'
import { uploadImage } from '../utils/cloudinaryUtils.js'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const catalog = [
  ['Chocolate Bouquets', 'chocolate-bouquets', 'Pink Chocolate Delight Bouquet', 'pink-chocolate-delight-bouquet', 'EDW-CB-001', 'chocolate-bouquet.jpg', 10500, 8950, 8],
  ['Teddy Bouquets', 'teddy-bouquets', 'Teddy Love Surprise Bouquet', 'teddy-love-surprise-bouquet', 'EDW-TB-001', 'teddy-bouquet.jpg', 8500, 7500, 11],
  ['Earring Bouquets', 'earring-bouquets', 'Golden Earring Bouquet', 'golden-earring-bouquet', 'EDW-EB-001', 'earring-bouquet.jpg', 9800, null, 5],
  ['Snack Bouquets', 'snack-bouquets', 'Premium Snack Celebration Box', 'premium-snack-celebration-box', 'EDW-SB-001', 'snack-box.jpg', 7200, 6500, 14],
  ['Kinder Joy Bouquets', 'kinder-joy-bouquets', 'Kinder Joy Dream Bouquet', 'kinder-joy-dream-bouquet', 'EDW-KJ-001', 'kinder-bouquet.jpg', 8900, 7900, 9],
  ['Makeup Bouquets', 'makeup-bouquets', 'Glam Makeup Gift Bouquet', 'glam-makeup-gift-bouquet', 'EDW-MB-001', 'makeup-bouquet.jpg', 14000, 12500, 6],
  ['Picture Bouquets', 'picture-bouquets', 'Memory Picture Bouquet', 'memory-picture-bouquet', 'EDW-PB-001', 'picture-bouquet.jpg', 10800, null, 4],
  ['Custom Gifts', 'custom-bouquets', 'Custom Pastel Gift Hamper', 'custom-pastel-gift-hamper', 'EDW-CG-001', 'gift-hamper.jpg', 15000, 13500, 7],
]

try {
  await mongoose.connect(env.mongoUri)
  for (let index = 0; index < catalog.length; index += 1) {
    const [categoryName, categorySlug, name, slug, sku, filename, price, discountPrice, stock] = catalog[index]
    if (await Product.exists({ $or: [{ sku }, { slug }] })) { console.log(`Skipped existing product: ${name}`); continue }
    const buffer = await readFile(path.join(root, 'client/src/assets/images/products', filename))
    const uploaded = await uploadImage({ buffer, mimetype: 'image/jpeg' })
    const category = await Category.findOneAndUpdate({ slug: categorySlug }, { $setOnInsert: { name: categoryName, slug: categorySlug, description: `Thoughtfully designed ${categoryName.toLowerCase()} from Eshaz Dream World.`, image: uploaded, sortOrder: index } }, { upsert: true, returnDocument: 'after' })
    await Product.create({ name, slug, sku, description: `${name} is a carefully arranged, customizable creation prepared with Eshaz Dream World’s signature attention to detail.`, shortDescription: `A thoughtful ${categoryName.toLowerCase()} creation for memorable moments.`, price, discountPrice, costPrice: 0, category: category._id, thumbnail: { ...uploaded, alt: name }, images: [], stock, sold: 0, tags: [categorySlug, 'gift'], isFeatured: index < 4, isTrending: index < 3, isActive: true, weight: 0, dimensions: { length: 0, width: 0, height: 0, unit: 'cm' } })
    console.log(`Imported: ${name}`)
  }
  console.log('Phase 2 catalog migration completed successfully.')
} catch (error) { console.error(`Catalog migration failed: ${error.message}`); process.exitCode = 1 } finally { await mongoose.disconnect() }
