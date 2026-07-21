import { env } from './env.js'

const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'https://edw-phi.vercel.app',
  ...env.clientOrigins
].map((origin) => origin.replace(/\/$/, ''))

export const corsOptions = {
  credentials: true,

  methods: [
    'GET',
    'POST',
    'PUT',
    'PATCH',
    'DELETE',
    'OPTIONS'
  ],

  allowedHeaders: [
    'Content-Type',
    'Authorization'
  ],

  origin(origin, callback) {
    // Allow Postman and server-to-server requests
    if (!origin) {
      return callback(null, true)
    }

    const normalizedOrigin = origin.replace(/\/$/, '')

    if (allowedOrigins.includes(normalizedOrigin)) {
      return callback(null, true)
    }

    const error = new Error(
      `Origin is not allowed by CORS: ${normalizedOrigin}`
    )

    error.statusCode = 403
    return callback(error)
  },

  optionsSuccessStatus: 204
}