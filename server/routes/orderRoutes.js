import { Router } from 'express'
import { cancelCustomerOrder, getCustomerOrder, listCustomerOrders, reorderCustomerOrder, resubmitBankTransferSlip, trackOrder } from '../controllers/customerOrderController.js'
import { downloadCustomerInvoice } from '../controllers/invoiceController.js'
import { protect } from '../middleware/authMiddleware.js'
import { cancellationValidator, trackingValidator, validateBankTransferResubmission, validateCheckout } from '../middleware/checkoutValidateMiddleware.js'
import { imageUpload } from '../middleware/uploadMiddleware.js'
const router = Router()
router.post('/track', validateCheckout(trackingValidator), trackOrder)
router.use(protect)
router.get('/', listCustomerOrders)
router.get('/:orderNumber', getCustomerOrder)
router.get('/:orderNumber/invoice', downloadCustomerInvoice)
router.post('/:orderNumber/cancel', validateCheckout(cancellationValidator), cancelCustomerOrder)
router.post('/:orderNumber/reorder', reorderCustomerOrder)
router.post('/:orderNumber/payment-slip', imageUpload.single('paymentSlip'), validateBankTransferResubmission, resubmitBankTransferSlip)
export default router
