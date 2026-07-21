import { Router } from 'express'
import { addAddress, changePassword, deleteAddress, getProfile, setDefaultAddress, updateAddress, updateProfile } from '../controllers/userController.js'
import { protect } from '../middleware/authMiddleware.js'
import { addressValidator, changePasswordValidator, profileValidator, validate, validateObjectIdParameter } from '../middleware/validateMiddleware.js'

const router = Router()
router.use(protect)

router.get('/profile', getProfile)
router.put('/profile', validate(profileValidator), updateProfile)
router.put('/change-password', validate(changePasswordValidator), changePassword)
router.post('/addresses', validate(addressValidator), addAddress)
router.put('/addresses/:addressId', validateObjectIdParameter('addressId'), validate(addressValidator), updateAddress)
router.delete('/addresses/:addressId', validateObjectIdParameter('addressId'), deleteAddress)
router.put('/addresses/:addressId/default', validateObjectIdParameter('addressId'), setDefaultAddress)

export default router
