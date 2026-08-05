import { Router } from 'express'
import { addAddress, changePassword, deleteAddress, deleteOwnAccount, getProfile, logoutAllDevices, setDefaultAddress, updateAddress, updateProfile } from '../controllers/userController.js'
import { protect } from '../middleware/authMiddleware.js'
import { accountDeletionValidator, addressValidator, changePasswordValidator, currentPasswordValidator, profileValidator, validate, validateObjectIdParameter } from '../middleware/validateMiddleware.js'
import { authenticationRateLimiter } from '../middleware/rateLimitMiddleware.js'

const router = Router()
router.use(protect)

router.get('/profile', getProfile)
router.put('/profile', validate(profileValidator), updateProfile)
router.put('/change-password', validate(changePasswordValidator), changePassword)
router.post('/sessions/revoke-all', authenticationRateLimiter, validate(currentPasswordValidator), logoutAllDevices)
router.delete('/account', authenticationRateLimiter, validate(accountDeletionValidator), deleteOwnAccount)
router.post('/addresses', validate(addressValidator), addAddress)
router.put('/addresses/:addressId', validateObjectIdParameter('addressId'), validate(addressValidator), updateAddress)
router.delete('/addresses/:addressId', validateObjectIdParameter('addressId'), deleteAddress)
router.put('/addresses/:addressId/default', validateObjectIdParameter('addressId'), setDefaultAddress)

export default router
