import { Router } from 'express'
import { getOrder, listCancelledOrders, listOrders, reviewOrderPayment, updateOrder } from '../controllers/orderController.js'
import { orderPaymentReviewValidator, orderUpdateValidator, validateBody } from '../middleware/adminValidateMiddleware.js'
import { validateObjectIdParameter } from '../middleware/validateMiddleware.js'
import { downloadAdminInvoice } from '../controllers/invoiceController.js'
import { replaceAdminOrderPaymentSlip, viewAdminOrderPaymentSlip } from '../controllers/paymentSlipController.js'
import { imageUpload } from '../middleware/uploadMiddleware.js'
import { uploadRateLimiter } from '../middleware/rateLimitMiddleware.js'
const router = Router()
router.get('/', listOrders)
router.get('/cancellations', listCancelledOrders)
router.get('/:id', validateObjectIdParameter('id'), getOrder)
router.get('/:id/payment-slip', validateObjectIdParameter('id'), viewAdminOrderPaymentSlip)
router.post('/:id/payment-slip', validateObjectIdParameter('id'), uploadRateLimiter, imageUpload.single('paymentSlip'), replaceAdminOrderPaymentSlip)
router.get('/:id/invoice', validateObjectIdParameter('id'), downloadAdminInvoice)
router.put('/:id/payment', validateObjectIdParameter('id'), validateBody(orderPaymentReviewValidator), reviewOrderPayment)
router.put('/:id', validateObjectIdParameter('id'), validateBody(orderUpdateValidator), updateOrder)
export default router
