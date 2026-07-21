import { Router } from 'express'
import { forgotPassword, getCurrentUser, login, logout, register, resetPassword } from '../controllers/authController.js'
import { protect } from '../middleware/authMiddleware.js'
import { emailValidator, loginValidator, registrationValidator, resetPasswordValidator, validate } from '../middleware/validateMiddleware.js'

const router = Router()

router.post('/register', validate(registrationValidator), register)
router.post('/login', validate(loginValidator), login)
router.post('/logout', logout)
router.get('/me', protect, getCurrentUser)
router.post('/forgot-password', validate(emailValidator), forgotPassword)
router.post('/reset-password/:token', validate(resetPasswordValidator), resetPassword)

export default router
