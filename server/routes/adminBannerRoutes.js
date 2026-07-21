import { Router } from 'express'
import { createBanner, deleteBanner, listBanners, toggleBanner, updateBanner } from '../controllers/bannerController.js'
import { bannerValidator, validateBody } from '../middleware/adminValidateMiddleware.js'
import { validateObjectIdParameter } from '../middleware/validateMiddleware.js'
const router = Router()
router.get('/', listBanners)
router.post('/', validateBody(bannerValidator), createBanner)
router.put('/:id', validateObjectIdParameter('id'), validateBody(bannerValidator), updateBanner)
router.delete('/:id', validateObjectIdParameter('id'), deleteBanner)
router.patch('/:id/toggle', validateObjectIdParameter('id'), toggleBanner)
export default router
