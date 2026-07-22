import { env } from './env.js'

const allowedOrigins = new Set(env.clientOrigins)

export const corsOptions = {
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  origin(origin, callback) {
    if (!origin || allowedOrigins.has(origin.replace(/\/$/, ''))) return callback(null, true)
    const error = new Error('Origin is not allowed by CORS')
    error.statusCode = 403
    return callback(error)
  },
  optionsSuccessStatus: 204,
}
