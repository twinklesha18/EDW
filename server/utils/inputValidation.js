const emailPattern = /^(?=.{6,160}$)(?!.*\.\.)[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$/i

export const normalizeEmail = (value) => String(value ?? '').trim().toLowerCase()

export const isValidEmail = (value) => emailPattern.test(normalizeEmail(value))

export const normalizePhone = (value) => {
  let phone = String(value ?? '').trim().replace(/[\s()-]/g, '')
  if (/^\+94\d{9}$/.test(phone)) phone = `0${phone.slice(3)}`
  return phone
}

export const isValidPhone = (value) => /^0\d{9}$/.test(normalizePhone(value))

export const PHONE_VALIDATION_MESSAGE = 'Enter a valid 10-digit phone number starting with 0'
export const EMAIL_VALIDATION_MESSAGE = 'Enter a valid email address'
