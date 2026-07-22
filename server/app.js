import cookieParser from 'cookie-parser'
import cors from 'cors'
import express from 'express'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { corsOptions } from './config/cors.js'
import { connectDatabase } from './config/db.js'
import { errorHandler, notFound } from './middleware/errorMiddleware.js'
import adminRoutes from './routes/adminRoutes.js'
import analyticsRoutes from './routes/analyticsRoutes.js'
import apiRoutes from './routes/apiRoutes.js'
import authRoutes from './routes/authRoutes.js'
import bannerRoutes from './routes/bannerRoutes.js'
import cartRoutes from './routes/cartRoutes.js'
import categoryRoutes from './routes/categoryRoutes.js'
import checkoutRoutes from './routes/checkoutRoutes.js'
import customOrderRoutes from './routes/customOrderRoutes.js'
import notificationRoutes from './routes/notificationRoutes.js'
import orderRoutes from './routes/orderRoutes.js'
import productRoutes from './routes/productRoutes.js'
import reviewRoutes from './routes/reviewRoutes.js'
import siteSettingsRoutes from './routes/siteSettingsRoutes.js'
import userRoutes from './routes/userRoutes.js'
import wishlistRoutes from './routes/wishlistRoutes.js'
import { getSitemap } from './controllers/seoController.js'

const app = express()
const uploadsDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), 'uploads')

app.disable('x-powered-by')
app.set('trust proxy', 1)
app.use(cors(corsOptions))
app.use(express.json({ limit: '10kb' }))
app.use(express.urlencoded({ extended: true, limit: '10kb' }))
app.use(cookieParser())

// Keep the deployment health check independent from MongoDB availability.
app.get('/', (request, response) => {
  response.status(200).json({
    success: true,
    message: 'EDW Backend is running successfully',
  })
})

app.use(async (request, response, next) => {
  try {
    await connectDatabase()
    next()
  } catch (error) {
    console.error('Database connection failed:', error.message)
    response.status(500).json({
      success: false,
      message: 'Database connection failed',
      errors: [],
    })
  }
})

app.use('/uploads', express.static(uploadsDirectory, {
  dotfiles: 'deny',
  index: false,
  maxAge: '7d',
  immutable: true,
}))

app.get('/sitemap.xml', getSitemap)

app.use('/api/v1', apiRoutes)
app.use('/api/analytics', analyticsRoutes)
app.use('/api/auth', authRoutes)
app.use('/api/users', userRoutes)
app.use('/api/cart', cartRoutes)
app.use('/api/wishlist', wishlistRoutes)
app.use('/api/products', productRoutes)
app.use('/api/categories', categoryRoutes)
app.use('/api/banners', bannerRoutes)
app.use('/api/reviews', reviewRoutes)
app.use('/api/notifications', notificationRoutes)
app.use('/api/checkout', checkoutRoutes)
app.use('/api/orders', orderRoutes)
app.use('/api/custom-orders', customOrderRoutes)
app.use('/api/site-settings', siteSettingsRoutes)
app.use('/api/admin', adminRoutes)

app.use(notFound)
app.use(errorHandler)

export default app
