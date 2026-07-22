import { Router } from 'express'
import { getOrder, listCancelledOrders, listOrders, reviewOrderPayment, updateOrder } from '../controllers/orderController.js'
import { orderPaymentReviewValidator, orderUpdateValidator, validateBody } from '../middleware/adminValidateMiddleware.js'
import { validateObjectIdParameter } from '../middleware/validateMiddleware.js'
import { downloadAdminInvoice } from '../controllers/invoiceController.js'
const router = Router()
router.get('/', listOrders)
router.get('/cancellations', listCancelledOrders)
router.get('/:id', validateObjectIdParameter('id'), getOrder)
router.get('/:id/invoice', validateObjectIdParameter('id'), downloadAdminInvoice)
router.put('/:id/payment', validateObjectIdParameter('id'), validateBody(orderPaymentReviewValidator), reviewOrderPayment)
router.put('/:id', validateObjectIdParameter('id'), validateBody(orderUpdateValidator), updateOrder)
export default router
