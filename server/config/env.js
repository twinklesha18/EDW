import dotenv from 'dotenv'

dotenv.config({ quiet: true })

const parsePort = (value) => {
  const port = Number.parseInt(value, 10)

  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('PORT must be a number between 1 and 65535')
  }

  return port
}

const required = (key) => {
  const value = process.env[key]?.trim()

  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`)
  }

  return value
}

export const env = Object.freeze({
  nodeEnv: process.env.NODE_ENV?.trim() || 'development',
  port: parsePort(process.env.PORT || '5000'),
  mongoUri: process.env.MONGO_URI?.trim() || required('MONGODB_URI'),
  jwtSecret: required('JWT_SECRET'),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN?.trim() || '7d',
  jwtRememberExpiresIn: process.env.JWT_REMEMBER_EXPIRES_IN?.trim() || '30d',
  clientOrigins: required('CLIENT_URL')
    .split(',')
    .map((origin) => origin.trim().replace(/\/$/, ''))
    .filter(Boolean),
  cloudinary: Object.freeze({
    cloudName: process.env.CLOUDINARY_CLOUD_NAME?.trim() || '',
    apiKey: process.env.CLOUDINARY_API_KEY?.trim() || '',
    apiSecret: process.env.CLOUDINARY_API_SECRET?.trim() || '',
  }),
  stripe: Object.freeze({
    secretKey: process.env.STRIPE_SECRET_KEY?.trim() || '',
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY?.trim() || '',
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET?.trim() || '',
  }),
  email: Object.freeze({
    host: process.env.EMAIL_HOST?.trim() || '',
    port: parsePort(process.env.EMAIL_PORT || '587'),
    user: process.env.EMAIL_USER?.trim() || '',
    pass: process.env.EMAIL_PASS?.trim() || '',
    from: process.env.EMAIL_FROM?.trim() || 'Eshaz Dream World <no-reply@eshazdreamworld.com>',
  }),
})
