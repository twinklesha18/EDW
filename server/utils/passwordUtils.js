import bcrypt from 'bcryptjs'
import crypto from 'node:crypto'

export const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,72}$/

export function isStrongPassword(password) {
  return typeof password === 'string' && passwordPattern.test(password)
}

export function createPasswordResetToken() {
  const token = crypto.randomBytes(32).toString('hex')
  const hashedToken = hashResetToken(token)
  return { token, hashedToken }
}

export function hashResetToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex')
}

export async function createPasswordResetOtp() {
  const otp = String(crypto.randomInt(100000, 1000000))
  const hashedOtp = await bcrypt.hash(otp, 10)
  return { otp, hashedOtp }
}

export function verifyPasswordResetOtpHash(otp, hashedOtp) {
  if (typeof otp !== 'string' || !/^\d{6}$/.test(otp) || typeof hashedOtp !== 'string' || !/^\$2[aby]\$/.test(hashedOtp)) return false
  return bcrypt.compare(otp, hashedOtp)
}
