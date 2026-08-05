import { waitUntil } from '@vercel/functions'
import Category from '../models/Category.js'
import Product from '../models/Product.js'
import Review from '../models/Review.js'
import { env } from '../config/env.js'
import { escapeRegex, paginationData, paginationFromQuery } from '../utils/queryUtils.js'
import { AppError, sendSuccess } from '../utils/responseUtils.js'
import { deleteImage } from '../utils/cloudinaryUtils.js'
import { announceNewProductSafely } from '../services/productAnnouncementService.js'

const publicPopulate = [{ path: 'category', select: 'name slug' }]
const slugify = (value) => String(value).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'product'

async function scheduleProductAnnouncement(product) {
  const task = announceNewProductSafely(product)
  if (!env.isProduction) return task
  try { waitUntil(task) }
  catch { await task }
  return null
}

async function productUsingImage(publicId, excludedId = null) {
  if (!publicId) return null
  return Product.findOne({
    $or: [{ 'image.publicId': publicId }, { 'images.publicId': publicId }],
    ...(excludedId && { _id: { $ne: excludedId } }),
  })
}

const productImageIds = (product) => [...new Set([
  product?.image?.publicId,
  ...(Array.isArray(product?.images) ? product.images.map((item) => item?.publicId) : []),
].filter(Boolean))]

async function deleteProductImageIfUnused(publicId, excludedId = null) {
  if (!publicId || await productUsingImage(publicId, excludedId)) return
  await deleteImage(publicId).catch(() => {})
}

async function uniqueSlug(name, excludedId) {
  const base = slugify(name)
  let slug = base
  let suffix = 2
  while (await Product.exists({ slug, ...(excludedId && { _id: { $ne: excludedId } }) })) slug = `${base}-${suffix++}`
  return slug
}

export async function listProducts(request, response) {
  const { page, limit, skip } = paginationFromQuery(request.query)
  const filter = {}
  if (request.query.search) filter.$text = { $search: String(request.query.search).slice(0, 100) }
  if (request.query.category) {
    const identifiers = [{ slug: request.query.category }]
    if (String(request.query.category).match(/^[a-f\d]{24}$/i)) identifiers.push({ _id: request.query.category })
    const category = await Category.findOne({ $or: identifiers }).select('_id')
    if (!category) return sendSuccess(response, { message: 'Products retrieved', data: { products: [], pagination: paginationData(0, page, limit) } })
    filter.category = category._id
  }
  const maxPrice = Number(request.query.maxPrice)
  if (Number.isFinite(maxPrice) && maxPrice > 0) filter.$or = ['S', 'M', 'L'].map((size) => ({ [`prices.${size}`]: { $lte: maxPrice } }))
  const sorts = { newest: { createdAt: -1 }, 'price-low': { 'prices.S': 1 }, 'price-high': { 'prices.S': -1 }, name: { name: 1 } }
  const [products, total] = await Promise.all([
    Product.find(filter).populate(publicPopulate).sort(sorts[request.query.sort] || sorts.newest).skip(skip).limit(limit),
    Product.countDocuments(filter),
  ])
  return sendSuccess(response, { message: 'Products retrieved', data: { products, pagination: paginationData(total, page, limit) } })
}

export async function getProduct(request, response) {
  const product = await Product.findOne({ slug: request.params.slug }).populate(publicPopulate)
  if (!product) throw new AppError('Product not found', 404)
  const reviews = await Review.find({ product: product._id, isApproved: true, isVisible: true }).populate('user', 'firstName lastName avatar').sort({ createdAt: -1 }).limit(20)
  return sendSuccess(response, { message: 'Product retrieved', data: { product, reviews } })
}

export async function adminListProducts(request, response) {
  const { page, limit, skip } = paginationFromQuery(request.query, { defaultLimit: 10 })
  const filter = {}
  if (request.query.search) {
    const pattern = new RegExp(escapeRegex(String(request.query.search).slice(0, 100)), 'i')
    filter.name = pattern
  }
  if (request.query.category) filter.category = request.query.category
  const allowedSort = { newest: { createdAt: -1 }, oldest: { createdAt: 1 }, name: { name: 1 }, price: { 'prices.S': 1 } }
  const [products, total] = await Promise.all([
    Product.find(filter).populate(publicPopulate).sort(allowedSort[request.query.sort] || allowedSort.newest).skip(skip).limit(limit),
    Product.countDocuments(filter),
  ])
  return sendSuccess(response, { message: 'Admin products retrieved', data: { products, pagination: paginationData(total, page, limit) } })
}

export async function adminGetProduct(request, response) {
  const product = await Product.findById(request.params.id).populate(publicPopulate)
  if (!product) throw new AppError('Product not found', 404)
  return sendSuccess(response, { message: 'Product retrieved', data: { product } })
}

export async function createProduct(request, response) {
  const publicId = request.validatedBody.image?.publicId
  const existing = await productUsingImage(publicId)
  if (existing) {
    await existing.populate(publicPopulate)
    return sendSuccess(response, { message: 'This uploaded image was already used to create the product', data: { product: existing } })
  }

  let product
  try {
    product = await Product.create({ ...request.validatedBody, slug: await uniqueSlug(request.validatedBody.name) })
  } catch (error) {
    if (error?.code !== 11000 || !publicId) throw error
    product = await productUsingImage(publicId)
    if (!product) throw error
    await product.populate(publicPopulate)
    return sendSuccess(response, { message: 'This uploaded image was already used to create the product', data: { product } })
  }
  await product.populate(publicPopulate)
  await scheduleProductAnnouncement(product)
  return sendSuccess(response, { statusCode: 201, message: 'Product created successfully', data: { product } })
}

export async function updateProduct(request, response) {
  const product = await Product.findById(request.params.id)
  if (!product) throw new AppError('Product not found', 404)
  const previousImageIds = productImageIds(product)
  Object.assign(product, request.validatedBody, { slug: await uniqueSlug(request.validatedBody.name, product._id) })
  await product.save()
  const currentImageIds = new Set(productImageIds(product))
  await Promise.all(previousImageIds.filter((publicId) => !currentImageIds.has(publicId)).map((publicId) => deleteProductImageIfUnused(publicId, product._id)))
  await product.populate(publicPopulate)
  return sendSuccess(response, { message: 'Product updated successfully', data: { product } })
}

export async function deleteProduct(request, response) {
  const product = await Product.findById(request.params.id)
  if (!product) throw new AppError('Product not found', 404)
  await Promise.all([Review.deleteMany({ product: product._id }), Product.deleteOne({ _id: product._id })])
  await Promise.all(productImageIds(product).map((publicId) => deleteProductImageIfUnused(publicId)))
  return sendSuccess(response, { message: 'Product deleted successfully' })
}
