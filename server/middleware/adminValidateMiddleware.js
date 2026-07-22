import mongoose from 'mongoose'
import { AppError } from '../utils/responseUtils.js'
import { EMAIL_VALIDATION_MESSAGE, PHONE_VALIDATION_MESSAGE, isValidEmail, isValidPhone, normalizeEmail, normalizePhone } from '../utils/inputValidation.js'
import { isStrongPassword } from '../utils/passwordUtils.js'

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

export const reviewValidator = (body) => { const errors = []; const rating = Number(body.rating), title = clean(body.title, 120), comment = clean(body.comment, 1500), orderNumber = clean(body.orderNumber, 40).toUpperCase(); if (!validId(body.productId)) errors.push(issue('productId', 'Product is invalid')); if (!/^EDW-\d{4}-\d{6}$/.test(orderNumber)) errors.push(issue('orderNumber', 'A valid delivered order is required')); if (!Number.isInteger(rating) || rating < 1 || rating > 5) errors.push(issue('rating', 'Rating must be between 1 and 5')); if (comment.length < 5) errors.push(issue('comment', 'Review must contain at least 5 characters')); return { values: { product: body.productId, orderNumber, rating, title, comment }, errors } }
export const reviewUpdateValidator = (body) => { const result = reviewValidator({ ...body, productId: new mongoose.Types.ObjectId().toString(), orderNumber: 'EDW-2000-000001' }); delete result.values.product; delete result.values.orderNumber; return result }
export const reviewModerationValidator = (body) => { const values = {}; const errors = []; if (typeof body.isApproved === 'boolean') values.isApproved = body.isApproved; if (typeof body.isVisible === 'boolean') values.isVisible = body.isVisible; if (!Object.keys(values).length) errors.push(issue('moderation', 'Provide an approval or visibility status')); return { values, errors } }


export const bannerValidator = (body) => { const errors = []; const title = clean(body.title, 160), position = body.position || 'hero'; if (!title) errors.push(issue('title', 'Image name or description is required')); if (!['hero', 'promotional', 'gallery'].includes(position)) errors.push(issue('position', 'Homepage section is invalid')); return { values: { title, image: image(body.image, 'image', errors, true), position, isActive: body.isActive !== false }, errors } }

export const orderUpdateValidator = (body) => { const errors = []; const statuses = ['Pending', 'Confirmed', 'Processing', 'Packed', 'Shipped', 'Delivered', 'Cancelled'], payments = ['Pending', 'Slip Submitted', 'Payment Rejected', 'Paid', 'Failed', 'Refunded']; const notes = clean(body.notes, 1000); if (body.orderStatus && !statuses.includes(body.orderStatus)) errors.push(issue('orderStatus', 'Order status is invalid')); if (body.paymentStatus && !payments.includes(body.paymentStatus)) errors.push(issue('paymentStatus', 'Payment status is invalid')); if (body.orderStatus === 'Cancelled' && notes.length < 10) errors.push(issue('notes', 'A cancellation reason of at least 10 characters is required')); return { values: { ...(body.orderStatus && { orderStatus: body.orderStatus }), ...(body.paymentStatus && { paymentStatus: body.paymentStatus }), trackingNumber: clean(body.trackingNumber, 120), notes }, errors } }

export const orderPaymentReviewValidator = (body) => {
  const action = clean(body.action, 40)
  const note = clean(body.note, 1000)
  const errors = []
  if (!['approve', 'reject', 'collect-cod'].includes(action)) errors.push(issue('action', 'Select a valid payment action'))
  if (action === 'reject' && note.length < 5) errors.push(issue('note', 'Explain why the payment slip was rejected'))
  return { values: { action, note }, errors }
}

export const userAdminValidator = (body) => { const errors = []; if (body.role && !['user', 'admin'].includes(body.role)) errors.push(issue('role', 'Role is invalid')); if (typeof body.isActive !== 'boolean' && !body.role) errors.push(issue('isActive', 'Account status is required')); return { values: { ...(body.role && { role: body.role }), ...(typeof body.isActive === 'boolean' && { isActive: body.isActive }) }, errors } }

const adminUserDetails = (body) => {
  const errors = []
  const firstName = clean(body.firstName, 60)
  const lastName = clean(body.lastName, 60)
  const email = normalizeEmail(clean(body.email, 160))
  const phone = normalizePhone(clean(body.phone, 24))
  const role = clean(body.role, 20)
  const isActive = body.isActive !== false
  if (firstName.length < 2) errors.push(issue('firstName', 'First name must contain at least 2 characters'))
  if (lastName.length < 2) errors.push(issue('lastName', 'Last name must contain at least 2 characters'))
  if (!isValidEmail(email)) errors.push(issue('email', EMAIL_VALIDATION_MESSAGE))
  if (!isValidPhone(phone)) errors.push(issue('phone', PHONE_VALIDATION_MESSAGE))
  if (!['user', 'admin'].includes(role)) errors.push(issue('role', 'Select User or Admin'))
  if (typeof body.isActive !== 'boolean') errors.push(issue('isActive', 'Account status is required'))
  return { values: { firstName, lastName, email, phone, role, isActive }, errors }
}

export const adminUserCreateValidator = (body) => {
  const result = adminUserDetails(body)
  const password = typeof body.password === 'string' ? body.password : ''
  const confirmPassword = typeof body.confirmPassword === 'string' ? body.confirmPassword : ''
  if (!isStrongPassword(password)) result.errors.push(issue('password', 'Password must contain 8–72 characters with uppercase, lowercase and a number'))
  if (password !== confirmPassword) result.errors.push(issue('confirmPassword', 'Passwords do not match'))
  result.values.password = password
  return result
}

export const adminUserUpdateValidator = adminUserDetails

export const adminUserPasswordValidator = (body) => {
  const password = typeof body.password === 'string' ? body.password : ''
  const confirmPassword = typeof body.confirmPassword === 'string' ? body.confirmPassword : ''
  const errors = []
  if (!isStrongPassword(password)) errors.push(issue('password', 'Password must contain 8–72 characters with uppercase, lowercase and a number'))
  if (password !== confirmPassword) errors.push(issue('confirmPassword', 'Passwords do not match'))
  return { values: { password }, errors }
}
