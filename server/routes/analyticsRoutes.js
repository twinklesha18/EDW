import { Router } from 'express'
import { recordWebsiteVisit } from '../controllers/analyticsController.js'

const router = Router()

router.post('/visit', recordWebsiteVisit)

export default router
