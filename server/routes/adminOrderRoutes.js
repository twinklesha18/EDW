import { Router } from 'express'
import { getOrder, listOrders, updateOrder } from '../controllers/orderController.js'
import { orderUpdateValidator, validateBody } from '../middleware/adminValidateMiddleware.js'
import { validateObjectIdParameter } from '../middleware/validateMiddleware.js'
import { downloadAdminInvoice } from '../controllers/invoiceController.js'
const router = Router()
router.get('/', listOrders)
router.get('/:id', validateObjectIdParameter('id'), getOrder)
router.get('/:id/invoice', validateObjectIdParameter('id'), downloadAdminInvoice)
router.put('/:id', validateObjectIdParameter('id'), validateBody(orderUpdateValidator), updateOrder)
export default router
