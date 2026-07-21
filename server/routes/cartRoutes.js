import { Router } from 'express'
import { addCartItem, clearCart, getCart, removeCartItem, syncCart, updateCartItem } from '../controllers/cartController.js'
import { protect } from '../middleware/authMiddleware.js'
import { cartItemValidator, cartQuantityValidator, cartSyncValidator, validate, validateObjectIdParameter } from '../middleware/validateMiddleware.js'

const router = Router()
router.use(protect)

router.get('/', getCart)
router.post('/items', validate(cartItemValidator), addCartItem)
router.put('/items/:itemId', validateObjectIdParameter('itemId'), validate(cartQuantityValidator), updateCartItem)
router.delete('/items/:itemId', validateObjectIdParameter('itemId'), removeCartItem)
router.delete('/', clearCart)
router.post('/sync', validate(cartSyncValidator), syncCart)

export default router
