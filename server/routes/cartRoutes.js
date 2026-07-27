import { Router } from 'express'
import { addCartItem, clearCart, ensureCartItem, getCart, removeCartItem, syncCart, updateCartItem } from '../controllers/cartController.js'
import { protect } from '../middleware/authMiddleware.js'
import { cartItemValidator, cartQuantityValidator, cartSyncValidator, validate, validateObjectIdParameter } from '../middleware/validateMiddleware.js'

const router = Router()
router.use(protect)

router.get('/', getCart)
router.post('/items', validate(cartItemValidator), addCartItem)
router.post('/items/ensure', validate(cartItemValidator), ensureCartItem)
router.put('/items/:itemId', validateObjectIdParameter('itemId'), validate(cartQuantityValidator), updateCartItem)
router.delete('/items/:itemId', validateObjectIdParameter('itemId'), removeCartItem)
router.delete('/', clearCart)
router.post('/sync', validate(cartSyncValidator), syncCart)

export default router
