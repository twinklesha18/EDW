import { env } from '../config/env.js'

const legacyUploadUrl = /^https?:\/\/(?:localhost|127\.0\.0\.1|\[::1\])(?::\d+)?(\/uploads\/[^?#]+)(?:[?#].*)?$/i

const publicMediaUrl = (value) => {
  if (typeof value !== 'string') return value
  const legacyMatch = value.match(legacyUploadUrl)
  if (legacyMatch) return `${env.serverUrl}${legacyMatch[1]}`
  if (env.isProduction && value.startsWith('/uploads/')) return `${env.serverUrl}${value}`
  return value
}

export const normalizePublicMediaUrls = (payload) => JSON.parse(JSON.stringify(payload, (_key, value) => publicMediaUrl(value)))

export class AppError extends Error {
  constructor(message, statusCode = 500, errors = []) {
    super(message)
    this.name = 'AppError'
    this.statusCode = statusCode
    this.errors = errors
  }
}

export function sendSuccess(response, { statusCode = 200, message, data = {} }) {
  return response.status(statusCode).json({ success: true, message, data: normalizePublicMediaUrls(data) })
}
