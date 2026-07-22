export const normalizeEmailInput = (value) => String(value ?? '').trim().toLowerCase()

export const normalizePhoneInput = (value) => String(value ?? '').trim().replace(/[\s()-]/g, '')

export const emailPattern = /^(?=.{6,160}$)(?!.*\.\.)[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$/i
export const phonePattern = /^0\d{9}$/

export const isValidEmailAddress = (value) => emailPattern.test(normalizeEmailInput(value))
export const isValidPhoneNumber = (value) => phonePattern.test(normalizePhoneInput(value))

export const PHONE_ERROR = 'Enter a valid 10-digit phone number starting with 0.'
export const EMAIL_ERROR = 'Enter a valid email address.'
