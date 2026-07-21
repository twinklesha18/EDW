import { Router } from 'express'
import { addWishlistItem, clearWishlist, getWishlist, removeWishlistItem, syncWishlist } from '../controllers/wishlistController.js'
import { protect } from '../middleware/authMiddleware.js'
import { validate, wishlistItemValidator, wishlistSyncValidator } from '../middleware/validateMiddleware.js'

const router = Router()
router.use(protect)

router.get('/', getWishlist)
router.post('/items', validate(wishlistItemValidator), addWishlistItem)
router.delete('/items/:productId', removeWishlistItem)
router.delete('/', clearWishlist)
router.post('/sync', validate(wishlistSyncValidator), syncWishlist)

export default router
