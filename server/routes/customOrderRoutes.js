import { Router } from 'express'
import { createCustomOrder, listMyCustomOrders } from '../controllers/customOrderController.js'
import { protect, authorizeRoles } from '../middleware/authMiddleware.js'
import { validateCustomOrder } from '../middleware/customOrderValidateMiddleware.js'
import { imageUpload } from '../middleware/uploadMiddleware.js'

const router = Router()
router.use(protect, authorizeRoles('user'))
router.get('/', listMyCustomOrders)
router.post('/', imageUpload.single('inspiration'), validateCustomOrder, createCustomOrder)
export default router
