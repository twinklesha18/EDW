import { Router } from 'express'
import { recordWebsiteVisit } from '../controllers/analyticsController.js'
import { analyticsRateLimiter } from '../middleware/rateLimitMiddleware.js'

const router = Router()

router.post('/visit', analyticsRateLimiter, recordWebsiteVisit)

export default router
