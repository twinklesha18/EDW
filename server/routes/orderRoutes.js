import { Router } from 'express'
import { cancelCustomerOrder, getCustomerOrder, listCustomerOrders, reorderCustomerOrder, trackOrder } from '../controllers/customerOrderController.js'
import { downloadCustomerInvoice } from '../controllers/invoiceController.js'
import { protect } from '../middleware/authMiddleware.js'
import { trackingValidator, validateCheckout } from '../middleware/checkoutValidateMiddleware.js'
const router = Router()
router.post('/track', validateCheckout(trackingValidator), trackOrder)
router.use(protect)
router.get('/', listCustomerOrders)
router.get('/:orderNumber', getCustomerOrder)
router.get('/:orderNumber/invoice', downloadCustomerInvoice)
router.post('/:orderNumber/cancel', cancelCustomerOrder)
router.post('/:orderNumber/reorder', reorderCustomerOrder)
export default router
