import { Router } from 'express'
import { getStorefrontBootstrap } from '../controllers/storefrontController.js'
import { cachePublicResponse } from '../middleware/publicCacheMiddleware.js'

const router = Router()

router.get('/bootstrap', cachePublicResponse, getStorefrontBootstrap)

export default router

