import { Router } from 'express'
import { getCustomOrder, listCustomOrders, reviewCustomOrderPayment, updateCustomOrder } from '../controllers/customOrderController.js'
import { validateCustomOrderPaymentReview, validateCustomOrderUpdate } from '../middleware/customOrderValidateMiddleware.js'
import { validateObjectIdParameter } from '../middleware/validateMiddleware.js'
import { viewAdminCustomOrderPaymentSlip } from '../controllers/paymentSlipController.js'

const router = Router()
router.get('/', listCustomOrders)
router.get('/:id', validateObjectIdParameter('id'), getCustomOrder)
router.get('/:id/payment-slip', validateObjectIdParameter('id'), viewAdminCustomOrderPaymentSlip)
router.put('/:id/payment', validateObjectIdParameter('id'), validateCustomOrderPaymentReview, reviewCustomOrderPayment)
router.put('/:id', validateObjectIdParameter('id'), validateCustomOrderUpdate, updateCustomOrder)
export default router
