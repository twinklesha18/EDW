import { Router } from 'express'
import { createCashOnDeliveryOrder, quoteCheckout } from '../controllers/checkoutController.js'
import { protect } from '../middleware/authMiddleware.js'
import { checkoutValidator, validateCheckout } from '../middleware/checkoutValidateMiddleware.js'
const router = Router()
router.use(protect)
router.post('/quote', validateCheckout(checkoutValidator), quoteCheckout)
router.post('/cod', validateCheckout(checkoutValidator), createCashOnDeliveryOrder)
export default router
