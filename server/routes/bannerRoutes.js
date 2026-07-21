import { Router } from 'express'
import { listActiveBanners } from '../controllers/bannerController.js'
const router = Router()
router.get('/', listActiveBanners)
export default router
