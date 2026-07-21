import { AppError } from '../utils/responseUtils.js'

const clean = (value, max = 250) => String(value ?? '').replace(/[<>\u0000-\u001F\u007F]/g, '').trim().slice(0, max)
const issue = (field, message) => ({ field, message })
const sriLankanPhone = /^(?:\+94|0)7\d{8}$/
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

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
  if (values.phone && !sriLankanPhone.test(values.phone.replace(/[\s-]/g, ''))) errors.push(issue(`${prefix}.phone`, 'Enter a valid Sri Lankan mobile number'))
  if (values.country.toLowerCase() !== 'sri lanka') errors.push(issue(`${prefix}.country`, 'Delivery is currently available only in Sri Lanka'))
  values.phone = values.phone.replace(/[\s-]/g, '')
  values.country = 'Sri Lanka'
  return values
}

export const checkoutValidator = (body) => {
  const errors = []
  const shippingAddress = address(body.shippingAddress, 'shippingAddress', errors)
  const billingAddress = body.billingSameAsShipping !== false ? { ...shippingAddress } : address(body.billingAddress, 'billingAddress', errors)
  const shippingMethod = ['standard', 'express', 'pickup'].includes(body.shippingMethod) ? body.shippingMethod : ''
  if (!shippingMethod) errors.push(issue('shippingMethod', 'Select a valid shipping method'))
  return { values: { shippingAddress, billingAddress, shippingMethod, couponCode: clean(body.couponCode, 40).toUpperCase() }, errors }
}

export const paymentVerificationValidator = (body) => {
  const paymentIntentId = clean(body.paymentIntentId, 200)
  return { values: { paymentIntentId }, errors: paymentIntentId.startsWith('pi_') ? [] : [issue('paymentIntentId', 'Payment reference is invalid')] }
}

export const trackingValidator = (body) => {
  const orderNumber = clean(body.orderNumber, 40).toUpperCase(), email = clean(body.email, 160).toLowerCase()
  const errors = []
  if (!/^EDW-\d{4}-\d{6}$/.test(orderNumber)) errors.push(issue('orderNumber', 'Enter a valid EDW order number'))
  if (!emailPattern.test(email)) errors.push(issue('email', 'Enter a valid email address'))
  return { values: { orderNumber, email }, errors }
}

export const validateCheckout = (validator) => (request, _response, next) => {
  const { values, errors } = validator(request.body || {})
  if (errors.length) return next(new AppError('Validation failed', 422, errors))
  request.validatedBody = values
  next()
}
