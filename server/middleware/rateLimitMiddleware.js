import { rateLimit } from 'express-rate-limit'

const jsonHandler = (_request, response) => response.status(429).json({
  success: false,
  message: 'Too many requests. Please wait and try again.',
  errors: [],
})

const limiter = ({ windowMs, limit, skipSuccessfulRequests = false }) => rateLimit({
  windowMs,
  limit,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  skip: (request) => request.method === 'OPTIONS',
  skipSuccessfulRequests,
  passOnStoreError: true,
  handler: jsonHandler,
})

export const apiRateLimiter = limiter({ windowMs: 15 * 60 * 1000, limit: 1000 })
export const authenticationRateLimiter = limiter({ windowMs: 15 * 60 * 1000, limit: 12, skipSuccessfulRequests: true })
export const registrationRateLimiter = limiter({ windowMs: 60 * 60 * 1000, limit: 8 })
export const recoveryRateLimiter = limiter({ windowMs: 60 * 60 * 1000, limit: 6 })
export const publicFormRateLimiter = limiter({ windowMs: 60 * 60 * 1000, limit: 20 })
export const trackingRateLimiter = limiter({ windowMs: 15 * 60 * 1000, limit: 30 })
export const analyticsRateLimiter = limiter({ windowMs: 15 * 60 * 1000, limit: 300 })
export const uploadRateLimiter = limiter({ windowMs: 60 * 60 * 1000, limit: 40 })
