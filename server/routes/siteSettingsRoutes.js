import { Router } from 'express'
import { getPublicSiteSettings } from '../controllers/siteSettingsController.js'
import { cachePublicResponse } from '../middleware/publicCacheMiddleware.js'

const router = Router()
router.get('/', cachePublicResponse, getPublicSiteSettings)
export default router
