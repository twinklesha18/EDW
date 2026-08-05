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

export function createPasswordResetOtp(email, secret) {
  const otp = String(crypto.randomInt(100000, 1000000))
  return { otp, hashedOtp: hashPasswordResetOtp(email, otp, secret) }
}

export function hashPasswordResetOtp(email, otp, secret) {
  return crypto
    .createHmac('sha256', secret)
    .update(`${String(email).trim().toLowerCase()}:${String(otp).trim()}`)
    .digest('hex')
}
