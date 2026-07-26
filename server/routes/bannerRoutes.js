import { Router } from 'express'
import { listActiveBanners } from '../controllers/bannerController.js'
import { cachePublicResponse } from '../middleware/publicCacheMiddleware.js'
const router = Router()
router.get('/', cachePublicResponse, listActiveBanners)
export default router
