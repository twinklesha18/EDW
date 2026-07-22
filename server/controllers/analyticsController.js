import { createHmac } from 'node:crypto'
import { env } from '../config/env.js'
import WebsiteVisit from '../models/WebsiteVisit.js'
import { AppError, sendSuccess } from '../utils/responseUtils.js'

const identifierPattern = /^[a-zA-Z0-9-]{16,80}$/
const botPattern = /bot|crawler|spider|crawling|headless|preview|facebookexternalhit|slurp|bingpreview/i

const anonymousHash = (value) => createHmac('sha256', env.jwtSecret).update(value).digest('hex')

const cleanPath = (value) => {
  const path = String(value || '').trim()
  if (!path.startsWith('/') || path.length > 250 || /[\u0000-\u001f]/.test(path)) return null
  return path
}

const detectDevice = (userAgent) => {
  if (/ipad|tablet|kindle|playbook|silk/i.test(userAgent)) return 'tablet'
  if (/mobile|iphone|ipod|android/i.test(userAgent)) return 'mobile'
  return 'desktop'
}

export async function recordWebsiteVisit(request, response, next) {
  try {
    const { visitorId, sessionId, path, eventType = 'pageview' } = request.body || {}
    const userAgent = String(request.get('user-agent') || '').slice(0, 500)

    if (botPattern.test(userAgent)) {
      return sendSuccess(response, { statusCode: 202, message: 'Automated traffic ignored' })
    }
    if (!identifierPattern.test(String(visitorId || '')) || !identifierPattern.test(String(sessionId || ''))) {
      throw new AppError('Invalid analytics identifier', 422)
    }
    const pagePath = cleanPath(path)
    if (!pagePath) throw new AppError('A valid page path is required', 422)
    if (!['pageview', 'heartbeat'].includes(eventType)) throw new AppError('Invalid analytics event type', 422)

    const now = new Date()
    const visitorHash = anonymousHash(`visitor:${visitorId}`)
    const sessionHash = anonymousHash(`session:${visitorId}:${sessionId}`)
    await WebsiteVisit.findOneAndUpdate(
      { sessionHash },
      {
        $setOnInsert: {
          visitorHash,
          sessionHash,
          entryPath: pagePath,
          firstSeenAt: now,
        },
        $set: {
          lastPath: pagePath,
          lastSeenAt: now,
          deviceType: detectDevice(userAgent),
        },
        ...(eventType === 'pageview' ? { $inc: { pageViews: 1 } } : {}),
      },
      { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true },
    )

    return sendSuccess(response, { statusCode: 202, message: 'Website visit recorded' })
  } catch (error) {
    return next(error)
  }
}
