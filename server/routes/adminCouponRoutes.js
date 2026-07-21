import { Router } from 'express'
import { createCoupon, deleteCoupon, listCoupons, toggleCoupon, updateCoupon } from '../controllers/couponController.js'
import { couponValidator, validateBody } from '../middleware/adminValidateMiddleware.js'
import { validateObjectIdParameter } from '../middleware/validateMiddleware.js'
const router = Router()
router.get('/', listCoupons)
router.post('/', validateBody(couponValidator), createCoupon)
router.put('/:id', validateObjectIdParameter('id'), validateBody(couponValidator), updateCoupon)
router.delete('/:id', validateObjectIdParameter('id'), deleteCoupon)
router.patch('/:id/toggle', validateObjectIdParameter('id'), toggleCoupon)
export default router
