import { AppError } from '../utils/responseUtils.js'
import { EMAIL_VALIDATION_MESSAGE, PHONE_VALIDATION_MESSAGE, isValidEmail, isValidPhone, normalizeEmail, normalizePhone } from '../utils/inputValidation.js'

const clean = (value, max = 250) => String(value ?? '').replace(/[<>\u0000-\u001F\u007F]/g, '').trim().slice(0, max)
const issue = (field, message) => ({ field, message })

const address = (source, prefix, errors) => {
  const values = {}
  const required = [['fullName', 120], ['phone', 20], ['addressLine1', 150], ['city', 80], ['district', 80], ['province', 80]]
  for (const [field, max] of required) {
    values[field] = clean(source?.[field], max)
    if (!values[field]) errors.push(issue(`${prefix}.${field}`, `${field} is required`))
  }
  values.addressLine2 = clean(source?.addressLine2, 150)
  values.postalCode = clean(source?.postalCode, 20)
  values.country = clean(source?.country, 80) || 'Sri Lanka'
  values.phone = normalizePhone(values.phone)
  if (values.phone && !isValidPhone(values.phone)) errors.push(issue(`${prefix}.phone`, PHONE_VALIDATION_MESSAGE))
  if (values.country.toLowerCase() !== 'sri lanka') errors.push(issue(`${prefix}.country`, 'Delivery is currently available only in Sri Lanka'))
  values.country = 'Sri Lanka'
  return values
}

export const checkoutValidator = (body) => {
  const errors = []
  const shippingAddress = address(body.shippingAddress, 'shippingAddress', errors)
  const billingAddress = body.billingSameAsShipping !== false ? { ...shippingAddress } : address(body.billingAddress, 'billingAddress', errors)
  const shippingMethod = ['standard', 'express', 'pickup'].includes(body.shippingMethod) ? body.shippingMethod : ''
  if (!shippingMethod) errors.push(issue('shippingMethod', 'Select a valid shipping method'))
  return { values: { shippingAddress, billingAddress, shippingMethod }, errors }
}

export const paymentVerificationValidator = (body) => {
  const paymentIntentId = clean(body.paymentIntentId, 200)
  return { values: { paymentIntentId }, errors: paymentIntentId.startsWith('pi_') ? [] : [issue('paymentIntentId', 'Payment reference is invalid')] }
}

export const trackingValidator = (body) => {
  const orderNumber = clean(body.orderNumber, 40).toUpperCase(), email = normalizeEmail(clean(body.email, 160))
  const errors = []
  if (!/^EDW-\d{4}-\d{6}$/.test(orderNumber)) errors.push(issue('orderNumber', 'Enter a valid EDW order number'))
  if (!isValidEmail(email)) errors.push(issue('email', EMAIL_VALIDATION_MESSAGE))
  return { values: { orderNumber, email }, errors }
}

export const cancellationValidator = (body) => {
  const reason = clean(body.reason, 500)
  const errors = []
  if (reason.length < 10) errors.push(issue('reason', 'Cancellation reason must contain at least 10 characters'))
  return { values: { reason }, errors }
}

export const validateCheckout = (validator) => (request, _response, next) => {
  const { values, errors } = validator(request.body || {})
  if (errors.length) return next(new AppError('Validation failed', 422, errors))
  request.validatedBody = values
  next()
}

export function validateBankTransferCheckout(request, _response, next) {
  let body
  try {
    body = JSON.parse(String(request.body?.checkout || ''))
  } catch {
    return next(new AppError('Checkout details are invalid', 422, [issue('checkout', 'Valid checkout details are required')]))
  }
  const { values, errors } = checkoutValidator(body)
  const paymentReference = clean(request.body?.paymentReference, 120)
  if (!request.file) errors.push(issue('paymentSlip', 'Upload the bank payment slip'))
  if (errors.length) return next(new AppError('Validation failed', 422, errors))
  request.validatedBody = { ...values, paymentReference }
  next()
}

export function validateBankTransferResubmission(request, _response, next) {
  if (!request.file) return next(new AppError('Validation failed', 422, [issue('paymentSlip', 'Upload the bank payment slip')]))
  request.validatedBody = { paymentReference: clean(request.body?.paymentReference, 120) }
  next()
}
