import cookieParser from 'cookie-parser'
import cors from 'cors'
import express from 'express'
import path from 'node:path'
import { fileURLToPath } from 'node:url'


import { corsOptions } from './config/cors.js'
import { connectDatabase } from './config/db.js'
import { errorHandler, notFound } from './middleware/errorMiddleware.js'

import apiRoutes from './routes/apiRoutes.js'
import authRoutes from './routes/authRoutes.js'
import cartRoutes from './routes/cartRoutes.js'
import userRoutes from './routes/userRoutes.js'
import wishlistRoutes from './routes/wishlistRoutes.js'
import adminRoutes from './routes/adminRoutes.js'
import bannerRoutes from './routes/bannerRoutes.js'
import categoryRoutes from './routes/categoryRoutes.js'
import productRoutes from './routes/productRoutes.js'
import reviewRoutes from './routes/reviewRoutes.js'
import checkoutRoutes from './routes/checkoutRoutes.js'
import paymentRoutes from './routes/paymentRoutes.js'
import orderRoutes from './routes/orderRoutes.js'
import customOrderRoutes from './routes/customOrderRoutes.js'

import { handleStripeWebhook } from './controllers/paymentController.js'

const app = express()

const uploadsDirectory = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  'uploads'
)

app.disable('x-powered-by')
app.set('trust proxy', 1)

app.use(cors(corsOptions))

// Stripe webhook must come before express.json()
app.post(
  '/api/payments/stripe/webhook',
  express.raw({ type: 'application/json' }),
  handleStripeWebhook
)

app.use(express.json({ limit: '10kb' }))
app.use(express.urlencoded({ extended: true, limit: '10kb' }))
app.use(cookieParser())

// Root route does not need MongoDB
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'EDW Backend is running successfully 🚀'
  })
})

// Connect MongoDB before API routes
app.use(async (req, res, next) => {
  try {
    await connectDatabase()
    next()
  } catch (error) {
    console.error('Database connection failed:', error.message)

    res.status(500).json({
      success: false,
      message: 'Database connection failed',
      errors: []
    })
  }
})

app.use(
  '/uploads',
  express.static(uploadsDirectory, {
    dotfiles: 'deny',
    index: false,
    maxAge: '7d',
    immutable: true
  })
)

// Root route
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'EDW Backend is running successfully 🚀'
  })
})

// API routes
app.use('/api/v1', apiRoutes)
app.use('/api/auth', authRoutes)
app.use('/api/users', userRoutes)
app.use('/api/cart', cartRoutes)
app.use('/api/wishlist', wishlistRoutes)
app.use('/api/products', productRoutes)
app.use('/api/categories', categoryRoutes)
app.use('/api/banners', bannerRoutes)
app.use('/api/reviews', reviewRoutes)
app.use('/api/checkout', checkoutRoutes)
app.use('/api/payments', paymentRoutes)
app.use('/api/orders', orderRoutes)
app.use('/api/custom-orders', customOrderRoutes)
app.use('/api/admin', adminRoutes)

// These must always be last
app.use(notFound)
app.use(errorHandler)

export default app