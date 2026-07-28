import { Router } from 'express'
import { getCustomOrder, listCustomOrders, reviewCustomOrderPayment, updateCustomOrder } from '../controllers/customOrderController.js'
import { validateCustomOrderPaymentReview, validateCustomOrderUpdate } from '../middleware/customOrderValidateMiddleware.js'
import { validateObjectIdParameter } from '../middleware/validateMiddleware.js'
import { replaceAdminCustomOrderPaymentSlip, viewAdminCustomOrderPaymentSlip } from '../controllers/paymentSlipController.js'
import { imageUpload } from '../middleware/uploadMiddleware.js'
import { uploadRateLimiter } from '../middleware/rateLimitMiddleware.js'

const router = Router()
router.get('/', listCustomOrders)
router.get('/:id', validateObjectIdParameter('id'), getCustomOrder)
router.get('/:id/payment-slip', validateObjectIdParameter('id'), viewAdminCustomOrderPaymentSlip)
router.post('/:id/payment-slip', validateObjectIdParameter('id'), uploadRateLimiter, imageUpload.single('paymentSlip'), replaceAdminCustomOrderPaymentSlip)
router.put('/:id/payment', validateObjectIdParameter('id'), validateCustomOrderPaymentReview, reviewCustomOrderPayment)
router.put('/:id', validateObjectIdParameter('id'), validateCustomOrderUpdate, updateCustomOrder)
export default router
