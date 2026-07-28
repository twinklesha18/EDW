import { createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto'
import { env } from '../config/env.js'
import { AppError, sendSuccess } from '../utils/responseUtils.js'

const safeMethods = new Set(['GET', 'HEAD', 'OPTIONS'])
const allowedOrigins = new Set(env.clientOrigins)
const csrfCookieName = env.isProduction ? '__Host-edw_csrf' : 'edw_csrf'
const csrfHeaderName = 'x-csrf-token'
const csrfMaxAge = env.session.rememberDays * 24 * 60 * 60 * 1000

const cookieOptions = Object.freeze({
  httpOnly: false,
  secure: env.isProduction,
  // The production frontend and API use separate Vercel hosts. SameSite=None
  // is required for credentialed API calls; the signed token and exact Origin
  // allowlist provide the CSRF protection.
  sameSite: env.isProduction ? 'none' : 'lax',
  maxAge: csrfMaxAge,
  path: '/',
})

const sessionBinding = (authToken = '') => createHash('sha256')
  .update(authToken || 'anonymous')
  .digest('hex')

const signatureFor = (randomValue, authToken) => createHmac('sha256', env.csrfSecret)
  .update(`${sessionBinding(authToken)}.${randomValue}`)
  .digest('base64url')

const equal = (left, right) => {
  const first = Buffer.from(String(left || ''))
  const second = Buffer.from(String(right || ''))
  return first.length === second.length && timingSafeEqual(first, second)
}

const validToken = (token, authToken) => {
  const [signature, randomValue, ...extra] = String(token || '').split('.')
  if (extra.length || !/^[A-Za-z0-9_-]{43}$/.test(signature || '') || !/^[A-Za-z0-9_-]{43}$/.test(randomValue || '')) return false
  return equal(signature, signatureFor(randomValue, authToken))
}

export function setCsrfCookie(response, authToken = '') {
  const randomValue = randomBytes(32).toString('base64url')
  const token = `${signatureFor(randomValue, authToken)}.${randomValue}`
  response.cookie(csrfCookieName, token, cookieOptions)
  response.setHeader('X-CSRF-Token', token)
  response.setHeader('Cache-Control', 'no-store')
  return token
}

export function getCsrfToken(request, response) {
  const token = setCsrfCookie(response, request.cookies?.edw_token)
  return sendSuccess(response, { message: 'Security token issued', data: { csrfToken: token } })
}

export function csrfProtection(request, _response, next) {
  if (safeMethods.has(request.method) || !request.path.startsWith('/api/')) return next()

  const fetchSite = String(request.get('sec-fetch-site') || '').toLowerCase()
  if (fetchSite === 'cross-site') return next(new AppError('Cross-site request blocked', 403))

  const origin = String(request.get('origin') || '').replace(/\/$/, '')
  if (origin && !allowedOrigins.has(origin)) return next(new AppError('Request origin is not allowed', 403))

  // Command-line and trusted server-to-server clients do not have a browser
  // origin context. Browser requests must prove intent with a signed token.
  if (!origin && !fetchSite) return next()

  const cookieToken = request.cookies?.[csrfCookieName]
  const headerToken = request.get(csrfHeaderName)
  if (!cookieToken || !headerToken || !equal(cookieToken, headerToken) || !validToken(headerToken, request.cookies?.edw_token)) {
    return next(new AppError('Security token is missing or invalid. Refresh the page and try again.', 403))
  }
  return next()
}

export { csrfCookieName }
