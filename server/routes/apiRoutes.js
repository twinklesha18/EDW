import { Router } from 'express'
import { getHealthStatus } from '../controllers/healthController.js'
import { migrateLegacyPaymentSlip } from '../controllers/paymentSlipController.js'
import { imageUpload } from '../middleware/uploadMiddleware.js'

const router = Router()

router.get('/health', getHealthStatus)
router.post('/maintenance/payment-slip', imageUpload.single('paymentSlip'), migrateLegacyPaymentSlip)

export default router
