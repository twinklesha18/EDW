import { AppError } from '../utils/responseUtils.js'
import { isStrongPassword } from '../utils/passwordUtils.js'
import { EMAIL_VALIDATION_MESSAGE, PHONE_VALIDATION_MESSAGE, isValidEmail, isValidPhone, normalizeEmail, normalizePhone } from '../utils/inputValidation.js'

const objectIdPattern = /^[a-f\d]{24}$/i

const sanitizeText = (value, maxLength = 250) =>
  String(value ?? '')
    .replace(/[<>\u0000-\u001F\u007F]/g, '')
    .trim()
    .slice(0, maxLength)

const error = (field, message) => ({ field, message })

const requiredText = (body, field, label, { min = 1, max = 120 } = {}) => {
  const value = sanitizeText(body[field], max)
  if (!value) return { value, error: error(field, `${label} is required`) }
  if (value.length < min) return { value, error: error(field, `${label} must be at least ${min} characters`) }
  return { value }
}

const optionalText = (body, field, max = 250) => sanitizeText(body[field], max)

const readEmail = (body) => {
  const value = normalizeEmail(sanitizeText(body.email, 160))
  if (!isValidEmail(value)) return { value, error: error('email', EMAIL_VALIDATION_MESSAGE) }
  return { value }
}

const readPhone = (body, field = 'phone') => {
  const value = normalizePhone(sanitizeText(body[field], 24))
  if (!isValidPhone(value)) return { value, error: error(field, PHONE_VALIDATION_MESSAGE) }
  return { value }
}

const readPassword = (body, field, label) => {
  const value = typeof body[field] === 'string' ? body[field] : ''
  if (!isStrongPassword(value)) return { value, error: error(field, `${label} must contain 8–72 characters with uppercase, lowercase and a number`) }
  return { value }
}

const validateFields = (values, errors) => ({ values, errors: errors.filter(Boolean) })

export const validate = (validator) => (request, _response, next) => {
  const { values, errors } = validator(request.body || {})
  if (errors.length) return next(new AppError('Validation failed', 422, errors))
  request.validatedBody = values
  next()
}

export const registrationValidator = (body) => {
  const firstName = requiredText(body, 'firstName', 'First name', { min: 2, max: 60 })
  const lastName = requiredText(body, 'lastName', 'Last name', { min: 2, max: 60 })
  const email = readEmail(body)
  const phone = readPhone(body)
  const password = readPassword(body, 'password', 'Password')
  const confirmPassword = typeof body.confirmPassword === 'string' ? body.confirmPassword : ''
  return validateFields(
    { firstName: firstName.value, lastName: lastName.value, email: email.value, phone: phone.value, password: password.value },
    [firstName.error, lastName.error, email.error, phone.error, password.error, password.value !== confirmPassword && error('confirmPassword', 'Passwords do not match')],
  )
}

export const loginValidator = (body) => {
  const email = readEmail(body)
  const password = typeof body.password === 'string' ? body.password : ''
  return validateFields(
    { email: email.value, password, rememberMe: body.rememberMe === true },
    [email.error, !password && error('password', 'Password is required')],
  )
}

export const emailValidator = (body) => {
  const email = readEmail(body)
  return validateFields({ email: email.value }, [email.error])
}

export const resetPasswordValidator = (body) => {
  const password = readPassword(body, 'password', 'Password')
  const confirmPassword = typeof body.confirmPassword === 'string' ? body.confirmPassword : ''
  return validateFields(
    { password: password.value },
    [password.error, password.value !== confirmPassword && error('confirmPassword', 'Passwords do not match')],
  )
}

export const profileValidator = (body) => {
  const firstName = requiredText(body, 'firstName', 'First name', { min: 2, max: 60 })
  const lastName = requiredText(body, 'lastName', 'Last name', { min: 2, max: 60 })
  const phone = readPhone(body)
  const avatar = optionalText(body, 'avatar', 500)
  return validateFields(
    { firstName: firstName.value, lastName: lastName.value, phone: phone.value, avatar },
    [firstName.error, lastName.error, phone.error, avatar && !/^https?:\/\//i.test(avatar) && error('avatar', 'Avatar must be a valid HTTP URL')],
  )
}

export const changePasswordValidator = (body) => {
  const currentPassword = typeof body.currentPassword === 'string' ? body.currentPassword : ''
  const newPassword = readPassword(body, 'newPassword', 'New password')
  const confirmNewPassword = typeof body.confirmNewPassword === 'string' ? body.confirmNewPassword : ''
  return validateFields(
    { currentPassword, newPassword: newPassword.value },
    [!currentPassword && error('currentPassword', 'Current password is required'), newPassword.error, newPassword.value !== confirmNewPassword && error('confirmNewPassword', 'Passwords do not match'), currentPassword === newPassword.value && error('newPassword', 'New password must be different from the current password')],
  )
}

export const addressValidator = (body) => {
  const fields = [
    ['label', 'Label', 2, 40], ['fullName', 'Full name', 2, 120],
    ['addressLine1', 'Address line 1', 3, 150], ['city', 'City', 2, 80], ['district', 'District', 2, 80],
    ['province', 'Province', 2, 80],
  ]
  const values = {}
  const errors = []
  for (const [field, label, min, max] of fields) {
    const result = requiredText(body, field, label, { min, max })
    values[field] = result.value
    if (result.error) errors.push(result.error)
  }
  const phone = readPhone(body)
  values.phone = phone.value
  if (phone.error) errors.push(phone.error)
  values.addressLine2 = optionalText(body, 'addressLine2', 150)
  values.postalCode = optionalText(body, 'postalCode', 20)
  values.country = optionalText(body, 'country', 80) || 'Sri Lanka'
  values.isDefault = body.isDefault === true
  return validateFields(values, errors)
}

const customizationValidator = (customization = {}) => ({
  message: sanitizeText(customization.message, 250),
  preferredColor: sanitizeText(customization.preferredColor, 100),
  notes: sanitizeText(customization.notes, 500),
})

export const cartItemValidator = (body) => {
  const productId = requiredText(body, 'productId', 'Product ID', { max: 100 })
  const size = String(body.size || '').toUpperCase()
  const quantity = Number(body.quantity)
  return validateFields(
    { productId: productId.value, size, quantity, customization: customizationValidator(body.customization) },
    [productId.error, !['S', 'M', 'L'].includes(size) && error('size', 'Size must be S, M, or L'), (!Number.isInteger(quantity) || quantity < 1 || quantity > 99) && error('quantity', 'Quantity must be between 1 and 99')],
  )
}

export const cartQuantityValidator = (body) => {
  const quantity = Number(body.quantity)
  return validateFields({ quantity }, [(!Number.isInteger(quantity) || quantity < 0) && error('quantity', 'Quantity must be a non-negative integer')])
}

export const cartSyncValidator = (body) => {
  if (!Array.isArray(body.items) || body.items.length > 50) return validateFields({ items: [] }, [error('items', 'Items must be an array with at most 50 entries')])
  const items = []
  const errors = []
  body.items.forEach((item, index) => {
    const result = cartItemValidator(item)
    if (result.errors.length) errors.push(...result.errors.map((entry) => ({ ...entry, field: `items.${index}.${entry.field}` })))
    else items.push(result.values)
  })
  return validateFields({ items }, errors)
}

export const wishlistItemValidator = (body) => {
  const productId = requiredText(body, 'productId', 'Product ID', { max: 100 })
  return validateFields({ productId: productId.value }, [productId.error])
}

export const wishlistSyncValidator = (body) => {
  if (!Array.isArray(body.items) || body.items.length > 100) return validateFields({ items: [] }, [error('items', 'Items must be an array with at most 100 entries')])
  const items = []
  const errors = []
  body.items.forEach((item, index) => {
    const result = wishlistItemValidator(item)
    if (result.errors.length) errors.push(...result.errors.map((entry) => ({ ...entry, field: `items.${index}.${entry.field}` })))
    else items.push(result.values)
  })
  return validateFields({ items }, errors)
}

export function validateObjectIdParameter(parameter = 'id') {
  return (request, _response, next) => {
    if (!objectIdPattern.test(request.params[parameter] || '')) return next(new AppError('Invalid resource identifier', 400))
    next()
  }
}
