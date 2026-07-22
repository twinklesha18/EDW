import { Router } from 'express'
import { cancelMyCustomOrder, createCustomOrder, getCustomOrderPaymentConfig, getMyCustomOrder, listMyCustomOrders, submitCustomOrderPayment } from '../controllers/customOrderController.js'
import { protect, authorizeRoles } from '../middleware/authMiddleware.js'
import { validateCustomOrder, validateCustomOrderPayment } from '../middleware/customOrderValidateMiddleware.js'
import { imageUpload } from '../middleware/uploadMiddleware.js'
import { validateObjectIdParameter } from '../middleware/validateMiddleware.js'

const router = Router()
router.use(protect, authorizeRoles('user'))
router.get('/payment-config', getCustomOrderPaymentConfig)
router.get('/', listMyCustomOrders)
router.post('/', imageUpload.single('inspiration'), validateCustomOrder, createCustomOrder)
router.get('/:id', validateObjectIdParameter('id'), getMyCustomOrder)
router.post('/:id/payment', validateObjectIdParameter('id'), imageUpload.single('paymentSlip'), validateCustomOrderPayment, submitCustomOrderPayment)
router.post('/:id/cancel', validateObjectIdParameter('id'), cancelMyCustomOrder)
export default router
