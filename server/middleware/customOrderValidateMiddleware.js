import mongoose from 'mongoose'
import { CUSTOM_ORDER_PAYMENT_METHODS, CUSTOM_ORDER_STATUSES } from '../models/CustomOrder.js'
import { AppError } from '../utils/responseUtils.js'

const occasions = ['Birthday', 'Engagement', 'Anniversary', 'Proposal', 'Baby Shower', 'Graduation', 'Wedding', 'Other']
const budgetRanges = ['Below LKR 5,000', 'LKR 5,000 - 10,000', 'LKR 10,000 - 15,000', 'Above LKR 15,000', 'Discuss with me']
const giftTypes = ['Bouquet', 'Gift Hamper', 'Photo Frame', 'Greeting Card', 'Gift Packing', 'Other']
const bouquetTypes = ['', 'Chocolate', 'Teddy', 'Earring', 'Snack', 'Kinder Joy', 'Makeup', 'Picture', 'Custom Mix']
const clean = (value, max) => String(value ?? '').replace(/[<>\u0000-\u001F\u007F]/g, '').trim().slice(0, max)
const issue = (field, message) => ({ field, message })

export function validateCustomOrder(request, _response, next) {
  const body = request.body || {}
  const errors = []
  const occasion = clean(body.occasion, 80)
  const budgetRange = clean(body.budgetRange, 80)
  const preferredColors = clean(body.preferredColors, 200)
  const giftType = clean(body.giftType, 80)
  const bouquetType = clean(body.bouquetType, 80)
  const specialMessage = clean(body.specialMessage, 500)
  const description = clean(body.description, 3000)
  const requiredDate = new Date(body.requiredDate)
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  if (!occasions.includes(occasion)) errors.push(issue('occasion', 'Please select a valid occasion'))
  if (Number.isNaN(requiredDate.getTime()) || requiredDate < today) errors.push(issue('requiredDate', 'Required date must be today or later'))
  if (!budgetRanges.includes(budgetRange)) errors.push(issue('budgetRange', 'Please select a valid budget range'))
  if (preferredColors.length < 2) errors.push(issue('preferredColors', 'Preferred colors are required'))
  if (!giftTypes.includes(giftType)) errors.push(issue('giftType', 'Please select a valid gift type'))
  if (!bouquetTypes.includes(bouquetType)) errors.push(issue('bouquetType', 'Please select a valid bouquet type'))
  if (description.length < 20) errors.push(issue('description', 'Description must contain at least 20 characters'))
  if (!['true', 'on', '1'].includes(String(body.agreement).toLowerCase())) errors.push(issue('agreement', 'Please confirm the custom-order agreement'))

  if (errors.length) return next(new AppError('Validation failed', 422, errors))
  request.validatedBody = { occasion, requiredDate, budgetRange, preferredColors, giftType, bouquetType, specialMessage, description }
  next()
}

export function validateCustomOrderUpdate(request, _response, next) {
  const body = request.body || {}
  const errors = []
  const status = clean(body.status, 40)
  const adminNote = clean(body.adminNote, 1000)
  const quotedPrice = body.quotedPrice === '' || body.quotedPrice === null || body.quotedPrice === undefined
    ? null
    : Number(body.quotedPrice)
  const trackingNumber = clean(body.trackingNumber, 120)
  const estimatedDelivery = body.estimatedDelivery ? new Date(body.estimatedDelivery) : null

  if (!CUSTOM_ORDER_STATUSES.includes(status)) errors.push(issue('status', 'Custom-order status is invalid'))
  if (quotedPrice !== null && (!Number.isFinite(quotedPrice) || quotedPrice < 0)) errors.push(issue('quotedPrice', 'Quoted price cannot be negative'))
  if (status === 'Quoted' && (!quotedPrice || quotedPrice <= 0)) errors.push(issue('quotedPrice', 'A positive quoted price is required before sending a quote'))
  if (estimatedDelivery && Number.isNaN(estimatedDelivery.getTime())) errors.push(issue('estimatedDelivery', 'Estimated delivery date is invalid'))
  if (errors.length) return next(new AppError('Validation failed', 422, errors))
  request.validatedBody = { status, adminNote, quotedPrice, trackingNumber, estimatedDelivery }
  next()
}

export function validateCustomOrderPayment(request, _response, next) {
  const paymentMethod = clean(request.body?.paymentMethod, 40)
  const addressId = clean(request.body?.addressId, 40)
  const paymentReference = clean(request.body?.paymentReference, 120)
  const errors = []
  if (!CUSTOM_ORDER_PAYMENT_METHODS.includes(paymentMethod)) errors.push(issue('paymentMethod', 'Select Cash on Delivery or Bank Transfer'))
  if (!mongoose.Types.ObjectId.isValid(addressId)) errors.push(issue('addressId', 'Select a valid saved delivery address'))
  if (paymentMethod === 'Bank Transfer' && !request.file) errors.push(issue('paymentSlip', 'Upload the bank payment slip'))
  if (paymentMethod === 'COD' && request.file) errors.push(issue('paymentSlip', 'A payment slip is not required for Cash on Delivery'))
  if (errors.length) return next(new AppError('Validation failed', 422, errors))
  request.validatedBody = { paymentMethod, addressId, paymentReference }
  next()
}

export function validateCustomOrderPaymentReview(request, _response, next) {
  const action = clean(request.body?.action, 40)
  const note = clean(request.body?.note, 1000)
  const errors = []
  if (!['approve', 'reject', 'collect-cod'].includes(action)) errors.push(issue('action', 'Select a valid payment action'))
  if (action === 'reject' && note.length < 5) errors.push(issue('note', 'Explain why the payment slip was rejected'))
  if (errors.length) return next(new AppError('Validation failed', 422, errors))
  request.validatedBody = { action, note }
  next()
}
