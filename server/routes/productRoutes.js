import { Router } from 'express'
import { getProduct, listProducts } from '../controllers/productController.js'
import { cachePublicResponse } from '../middleware/publicCacheMiddleware.js'
const router = Router()
router.get('/', cachePublicResponse, listProducts)
router.get('/:slug', cachePublicResponse, getProduct)
export default router
