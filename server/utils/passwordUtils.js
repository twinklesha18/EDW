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
