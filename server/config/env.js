import dotenv from 'dotenv'

dotenv.config({ quiet: true })

const parsePort = (value) => {
  const port = Number.parseInt(value, 10)

  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('PORT must be a number between 1 and 65535')
  }

  return port
}

const positiveInteger = (value, fallback, key) => {
  const parsed = Number.parseInt(value ?? fallback, 10)
  if (!Number.isInteger(parsed) || parsed < 1) throw new Error(`${key} must be a positive integer`)
  return parsed
}

const required = (key) => {
  const value = process.env[key]?.trim()

  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`)
  }

  return value
}

const defaultClientOrigins = ['http://localhost:5173', 'http://localhost:3000', 'https://edw-phi.vercel.app']
const configuredClientOrigins = String(process.env.CLIENT_URL || '')
  .split(',')
  .map((origin) => origin.trim().replace(/\/$/, ''))
  .filter(Boolean)
const isProduction = process.env.NODE_ENV === 'production' || Boolean(process.env.VERCEL) || process.env.VERCEL_ENV === 'production'

const isLocalMongoUri = (value) => /^mongodb:\/\/(?:[^@/]+@)?(?:localhost|127\.0\.0\.1|\[::1\])(?::\d+)?\//i.test(value)
const isAtlasMongoUri = (value) => /^mongodb\+srv:\/\//i.test(value)
const hasDatabaseName = (value) => {
  const authorityEnd = value.indexOf('/', value.indexOf('://') + 3)
  return authorityEnd > -1 && Boolean(value.slice(authorityEnd + 1).split('?')[0].trim())
}

const resolveMongoUri = () => {
  const candidates = isProduction
    ? [process.env.MONGODB_URI_PRODUCTION, process.env.MONGODB_URI, process.env.MONGO_URI]
    : [process.env.MONGODB_URI_LOCAL, process.env.MONGODB_URI, process.env.MONGO_URI]
  const value = candidates.find((candidate) => candidate?.trim())?.trim()
  if (!value) throw new Error(`Missing required environment variable: ${isProduction ? 'MONGODB_URI_PRODUCTION' : 'MONGODB_URI_LOCAL'}`)
  if (isProduction && (!isAtlasMongoUri(value) || !hasDatabaseName(value))) {
    throw new Error('Production MongoDB must use a MongoDB Atlas SRV URI with an explicit database name')
  }
  if (!isProduction && process.env.MONGODB_URI_LOCAL?.trim() && !isLocalMongoUri(value)) {
    throw new Error('MONGODB_URI_LOCAL must use localhost, 127.0.0.1, or ::1 with an explicit database name')
  }
  return value
}

export const env = Object.freeze({
  nodeEnv: process.env.NODE_ENV?.trim() || 'development',
  isProduction,
  port: parsePort(process.env.PORT || '5000'),
  mongoUri: resolveMongoUri(),
  jwtSecret: required('JWT_SECRET'),
  session: Object.freeze({
    idleMinutes: positiveInteger(process.env.SESSION_IDLE_TIMEOUT_MINUTES, 10, 'SESSION_IDLE_TIMEOUT_MINUTES'),
    absoluteHours: positiveInteger(process.env.SESSION_ABSOLUTE_TIMEOUT_HOURS, 8, 'SESSION_ABSOLUTE_TIMEOUT_HOURS'),
    rememberDays: positiveInteger(process.env.SESSION_REMEMBER_TIMEOUT_DAYS, 7, 'SESSION_REMEMBER_TIMEOUT_DAYS'),
  }),
  clientOrigins: [...new Set([...defaultClientOrigins, ...configuredClientOrigins])],
  cloudinary: Object.freeze({
    cloudName: process.env.CLOUDINARY_CLOUD_NAME?.trim() || '',
    apiKey: process.env.CLOUDINARY_API_KEY?.trim() || '',
    apiSecret: process.env.CLOUDINARY_API_SECRET?.trim() || '',
  }),
  email: Object.freeze({
    host: process.env.EMAIL_HOST?.trim() || '',
    port: parsePort(process.env.EMAIL_PORT || '587'),
    user: process.env.EMAIL_USER?.trim() || '',
    pass: process.env.EMAIL_PASS?.trim() || '',
    from: process.env.EMAIL_FROM?.trim() || 'Eshaz Dream World <no-reply@eshazdreamworld.com>',
  }),
})
