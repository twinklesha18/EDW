import { AppError } from '../utils/responseUtils.js'
import { EMAIL_VALIDATION_MESSAGE, PHONE_VALIDATION_MESSAGE, isValidEmail, isValidPhone, normalizeEmail, normalizePhone } from '../utils/inputValidation.js'

const clean = (value, max = 2500) => String(value ?? '').replace(/[<>\u0000-\u001F\u007F]/g, '').trim().slice(0, max)
const issue = (field, message) => ({ field, message })
const url = (value, field, errors, max = 2500) => {
  const result = clean(value, max)
  if (result && !/^https:\/\//i.test(result)) errors.push(issue(field, 'Use a secure https:// URL'))
  return result
}
const socialUrl = (value, field, platformHost, errors) => {
  const result = url(value, field, errors, 1200)
  if (!result) return ''
  try {
    const hostname = new URL(result).hostname.toLowerCase().replace(/^www\./, '')
    if (hostname !== platformHost && !hostname.endsWith(`.${platformHost}`)) errors.push(issue(field, `Use an official ${platformHost} link`))
  } catch {
    errors.push(issue(field, 'Enter a valid secure social media URL'))
  }
  return result
}

export function validateSiteSettings(request, _response, next) {
  const body = request.body || {}
  const errors = []
  const business = {
    name: clean(body.business?.name, 120), tagline: clean(body.business?.tagline, 180),
    logo: {
      url: clean(body.business?.logo?.url, 800), publicId: clean(body.business?.logo?.publicId, 300),
      width: Math.max(0, Number(body.business?.logo?.width) || 0), height: Math.max(0, Number(body.business?.logo?.height) || 0),
      bytes: Math.max(0, Number(body.business?.logo?.bytes) || 0), storage: ['local', 'cloudinary'].includes(body.business?.logo?.storage) ? body.business.logo.storage : '',
    },
  }
  if (business.name.length < 2) errors.push(issue('business.name', 'Business name must contain at least 2 characters'))
  const contact = {
    phone: normalizePhone(clean(body.contact?.phone, 24)), whatsapp: normalizePhone(clean(body.contact?.whatsapp, 24)),
    email: normalizeEmail(clean(body.contact?.email, 160)), location: clean(body.contact?.location, 180),
    mapsHref: url(body.contact?.mapsHref, 'contact.mapsHref', errors, 1200), mapEmbedUrl: url(body.contact?.mapEmbedUrl, 'contact.mapEmbedUrl', errors),
    instagram: socialUrl(body.contact?.instagram, 'contact.instagram', 'instagram.com', errors),
    facebook: socialUrl(body.contact?.facebook, 'contact.facebook', 'facebook.com', errors),
    tiktok: socialUrl(body.contact?.tiktok, 'contact.tiktok', 'tiktok.com', errors),
  }
  if (!isValidPhone(contact.phone)) errors.push(issue('contact.phone', PHONE_VALIDATION_MESSAGE))
  if (!isValidPhone(contact.whatsapp)) errors.push(issue('contact.whatsapp', `WhatsApp: ${PHONE_VALIDATION_MESSAGE.toLowerCase()}`))
  if (!isValidEmail(contact.email)) errors.push(issue('contact.email', EMAIL_VALIDATION_MESSAGE))
  const bank = {
    bankName: clean(body.bank?.bankName, 160), accountName: clean(body.bank?.accountName, 160), accountNumber: clean(body.bank?.accountNumber, 80),
    branch: clean(body.bank?.branch, 160), branchCode: clean(body.bank?.branchCode, 40), instructions: clean(body.bank?.instructions, 600),
  }
  const bankRequired = [bank.bankName, bank.accountName, bank.accountNumber, bank.branch]
  if (bankRequired.some(Boolean) && !bankRequired.every(Boolean)) errors.push(issue('bank', 'Bank name, account holder, account number, and branch are all required to enable bank transfer'))
  const number = (value, field, { min = 0, max = 1000000, integer = false } = {}) => {
    const parsed = Number(value)
    if (!Number.isFinite(parsed) || parsed < min || parsed > max || (integer && !Number.isInteger(parsed))) errors.push(issue(field, `${field} is invalid`))
    return parsed
  }
  const shipping = {
    standardFee: number(body.shipping?.standardFee, 'shipping.standardFee'), expressFee: number(body.shipping?.expressFee, 'shipping.expressFee'), pickupFee: number(body.shipping?.pickupFee, 'shipping.pickupFee'),
    standardDays: number(body.shipping?.standardDays, 'shipping.standardDays', { min: 1, max: 30, integer: true }), expressDays: number(body.shipping?.expressDays, 'shipping.expressDays', { min: 1, max: 30, integer: true }), pickupDays: number(body.shipping?.pickupDays, 'shipping.pickupDays', { min: 1, max: 30, integer: true }),
  }
  if (errors.length) return next(new AppError('Validation failed', 422, errors))
  request.validatedBody = { business, contact, bank, shipping }
  next()
}
