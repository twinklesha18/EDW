import { env } from './env.js'

export const corsOptions = {
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  origin(origin, callback) {
    const normalizedOrigin = origin?.replace(/\/$/, '')

    if (!origin || env.clientOrigins.includes(normalizedOrigin)) {
      callback(null, true)
      return
    }

    const error = new Error('Origin is not allowed by CORS')
    error.statusCode = 403
    callback(error)
  },
}
