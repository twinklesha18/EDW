import { Router } from 'express'
import { createStripePaymentIntent, recordStripeFailure, verifyStripePayment } from '../controllers/paymentController.js'
import { protect } from '../middleware/authMiddleware.js'
import { checkoutValidator, paymentVerificationValidator, validateCheckout } from '../middleware/checkoutValidateMiddleware.js'
const router = Router()
router.use(protect)
router.post('/stripe/intent', validateCheckout(checkoutValidator), createStripePaymentIntent)
router.post('/stripe/verify', validateCheckout(paymentVerificationValidator), verifyStripePayment)
router.post('/stripe/failure', validateCheckout(paymentVerificationValidator), recordStripeFailure)
export default router
