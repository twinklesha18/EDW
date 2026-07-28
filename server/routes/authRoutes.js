import { Router } from 'express'
import { forgotPassword, getCurrentUser, login, logout, register, resetPassword } from '../controllers/authController.js'
import { protect } from '../middleware/authMiddleware.js'
import { emailValidator, loginValidator, registrationValidator, resetPasswordValidator, validate } from '../middleware/validateMiddleware.js'
import { getCsrfToken } from '../middleware/csrfMiddleware.js'
import { authenticationRateLimiter, recoveryRateLimiter, registrationRateLimiter } from '../middleware/rateLimitMiddleware.js'

const router = Router()

router.get('/csrf-token', getCsrfToken)
router.post('/register', registrationRateLimiter, validate(registrationValidator), register)
router.post('/login', authenticationRateLimiter, validate(loginValidator), login)
router.post('/logout', logout)
router.get('/me', protect, getCurrentUser)
router.post('/forgot-password', recoveryRateLimiter, validate(emailValidator), forgotPassword)
router.post('/reset-password/:token', recoveryRateLimiter, validate(resetPasswordValidator), resetPassword)

export default router
