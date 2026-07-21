import mongoose from 'mongoose'
import { AppError } from '../utils/responseUtils.js'

const clean = (value, max = 500) => String(value ?? '').replace(/[<>\u0000-\u001F\u007F]/g, '').trim().slice(0, max)
const slugify = (value) => clean(value, 180).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
const issue = (field, message) => ({ field, message })
const validId = (value) => mongoose.isValidObjectId(value)
const image = (value, field, errors, required = false) => {
  const url = clean(value?.url, 800), publicId = clean(value?.publicId, 300), alt = clean(value?.alt, 160)
  if (required && !url) errors.push(issue(field, `${field} image is required`))
  if (url && !/^(https?:\/\/|\/)/i.test(url)) errors.push(issue(`${field}.url`, 'Image URL is invalid'))
  return { url, publicId, alt }
}

export const validateBody = (validator) => (request, _response, next) => {
  const { values, errors } = validator(request.body || {})
  if (errors.length) return next(new AppError('Validation failed', 422, errors))
  request.validatedBody = values
  next()
}

export const productValidator = (body) => {
  const errors = []
  const name = clean(body.name, 160)
  const description = clean(body.description, 5000)
  if (name.length < 2) errors.push(issue('name', 'Name must contain at least 2 characters'))
  if (description.length < 10) errors.push(issue('description', 'Description must contain at least 10 characters'))
  if (!validId(body.category)) errors.push(issue('category', 'A valid category is required'))
  const prices = Object.fromEntries(['S', 'M', 'L'].map((size) => {
    const value = Number(body.prices?.[size])
    if (!Number.isFinite(value) || value < 0.01) errors.push(issue(`prices.${size}`, `${size} price must be at least 0.01`))
    return [size, value]
  }))
  const productImage = image(body.image, 'image', errors, true)
  return { values: { name, category: body.category, description, prices, image: productImage }, errors }
}

export const categoryValidator = (body) => { const errors = []; const name = clean(body.name, 80), slug = slugify(body.slug || body.name), description = clean(body.description, 500), sortOrder = Number(body.sortOrder) || 0; if (name.length < 2) errors.push(issue('name', 'Name must contain at least 2 characters')); if (!slug) errors.push(issue('slug', 'A valid slug is required')); if (body.parentCategory && !validId(body.parentCategory)) errors.push(issue('parentCategory', 'Parent category is invalid')); if (sortOrder < 0) errors.push(issue('sortOrder', 'Sort order cannot be negative')); return { values: { name, slug, description, image: image(body.image, 'image', errors), parentCategory: body.parentCategory || null, isActive: body.isActive !== false, sortOrder }, errors } }

export const reviewValidator = (body) => { const errors = []; const rating = Number(body.rating), title = clean(body.title, 120), comment = clean(body.comment, 1500); if (!validId(body.productId)) errors.push(issue('productId', 'Product is invalid')); if (!Number.isInteger(rating) || rating < 1 || rating > 5) errors.push(issue('rating', 'Rating must be between 1 and 5')); if (comment.length < 5) errors.push(issue('comment', 'Review must contain at least 5 characters')); return { values: { product: body.productId, rating, title, comment }, errors } }
export const reviewUpdateValidator = (body) => { const result = reviewValidator({ ...body, productId: new mongoose.Types.ObjectId().toString() }); delete result.values.product; return result }
export const reviewModerationValidator = (body) => { const values = {}; const errors = []; if (typeof body.isApproved === 'boolean') values.isApproved = body.isApproved; if (typeof body.isVisible === 'boolean') values.isVisible = body.isVisible; if (!Object.keys(values).length) errors.push(issue('moderation', 'Provide an approval or visibility status')); return { values, errors } }

export const couponValidator = (body) => { const errors = []; const code = clean(body.code, 40).toUpperCase(), discountType = body.discountType, discountValue = Number(body.discountValue), minimumAmount = Number(body.minimumAmount) || 0, maximumDiscount = body.maximumDiscount === '' || body.maximumDiscount === null ? null : Number(body.maximumDiscount), expiryDate = new Date(body.expiryDate), usageLimit = Number(body.usageLimit); if (!code) errors.push(issue('code', 'Coupon code is required')); if (!['percentage', 'fixed'].includes(discountType)) errors.push(issue('discountType', 'Discount type is invalid')); if (!Number.isFinite(discountValue) || discountValue <= 0 || (discountType === 'percentage' && discountValue > 100)) errors.push(issue('discountValue', 'Discount value is invalid')); if (minimumAmount < 0) errors.push(issue('minimumAmount', 'Minimum amount cannot be negative')); if (maximumDiscount !== null && (!Number.isFinite(maximumDiscount) || maximumDiscount < 0)) errors.push(issue('maximumDiscount', 'Maximum discount is invalid')); if (Number.isNaN(expiryDate.getTime())) errors.push(issue('expiryDate', 'Expiry date is invalid')); if (!Number.isInteger(usageLimit) || usageLimit < 1) errors.push(issue('usageLimit', 'Usage limit must be at least 1')); return { values: { code, discountType, discountValue, minimumAmount, maximumDiscount, expiryDate, usageLimit, isActive: body.isActive !== false }, errors } }

export const bannerValidator = (body) => { const errors = []; const title = clean(body.title, 160), position = body.position || 'hero', startsAt = body.startsAt ? new Date(body.startsAt) : null, endsAt = body.endsAt ? new Date(body.endsAt) : null; if (!title) errors.push(issue('title', 'Title is required')); if (!['hero', 'promotional', 'collection'].includes(position)) errors.push(issue('position', 'Position is invalid')); if (startsAt && Number.isNaN(startsAt.getTime())) errors.push(issue('startsAt', 'Start date is invalid')); if (endsAt && Number.isNaN(endsAt.getTime())) errors.push(issue('endsAt', 'End date is invalid')); if (startsAt && endsAt && endsAt <= startsAt) errors.push(issue('endsAt', 'End date must be after start date')); return { values: { title, subtitle: clean(body.subtitle, 300), image: image(body.image, 'image', errors, true), link: clean(body.link, 500), buttonText: clean(body.buttonText, 60), position, isActive: body.isActive !== false, sortOrder: Math.max(0, Number(body.sortOrder) || 0), startsAt, endsAt }, errors } }

export const orderUpdateValidator = (body) => { const errors = []; const statuses = ['Pending', 'Confirmed', 'Processing', 'Packed', 'Shipped', 'Delivered', 'Cancelled'], payments = ['Pending', 'Paid', 'Failed', 'Refunded']; if (body.orderStatus && !statuses.includes(body.orderStatus)) errors.push(issue('orderStatus', 'Order status is invalid')); if (body.paymentStatus && !payments.includes(body.paymentStatus)) errors.push(issue('paymentStatus', 'Payment status is invalid')); return { values: { ...(body.orderStatus && { orderStatus: body.orderStatus }), ...(body.paymentStatus && { paymentStatus: body.paymentStatus }), trackingNumber: clean(body.trackingNumber, 120), notes: clean(body.notes, 1000) }, errors } }

export const userAdminValidator = (body) => { const errors = []; if (body.role && !['user', 'admin'].includes(body.role)) errors.push(issue('role', 'Role is invalid')); if (typeof body.isActive !== 'boolean' && !body.role) errors.push(issue('isActive', 'Account status is required')); return { values: { ...(body.role && { role: body.role }), ...(typeof body.isActive === 'boolean' && { isActive: body.isActive }) }, errors } }
