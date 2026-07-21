import { Router } from 'express'
import { createReview, deleteOwnReview, updateOwnReview } from '../controllers/reviewController.js'
import { protect } from '../middleware/authMiddleware.js'
import { reviewUpdateValidator, reviewValidator, validateBody } from '../middleware/adminValidateMiddleware.js'
import { validateObjectIdParameter } from '../middleware/validateMiddleware.js'
const router = Router()
router.use(protect)
router.post('/', validateBody(reviewValidator), createReview)
router.put('/:id', validateObjectIdParameter('id'), validateBody(reviewUpdateValidator), updateOwnReview)
router.delete('/:id', validateObjectIdParameter('id'), deleteOwnReview)
export default router
