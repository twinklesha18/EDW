import { Router } from 'express'
import { createBankTransferOrder, createCashOnDeliveryOrder, getCheckoutPaymentConfig, quoteCheckout } from '../controllers/checkoutController.js'
import { protect } from '../middleware/authMiddleware.js'
import { checkoutValidator, validateBankTransferCheckout, validateCheckout } from '../middleware/checkoutValidateMiddleware.js'
import { imageUpload } from '../middleware/uploadMiddleware.js'
const router = Router()
router.use(protect)
router.get('/payment-config', getCheckoutPaymentConfig)
router.post('/quote', validateCheckout(checkoutValidator), quoteCheckout)
router.post('/cod', validateCheckout(checkoutValidator), createCashOnDeliveryOrder)
router.post('/bank-transfer', imageUpload.single('paymentSlip'), validateBankTransferCheckout, createBankTransferOrder)
export default router
