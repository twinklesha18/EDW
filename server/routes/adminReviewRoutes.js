import { Router } from 'express'
import { adminDeleteReview, adminListReviews, moderateReview } from '../controllers/reviewController.js'
import { reviewModerationValidator, validateBody } from '../middleware/adminValidateMiddleware.js'
import { validateObjectIdParameter } from '../middleware/validateMiddleware.js'
const router = Router()
router.get('/', adminListReviews)
router.patch('/:id/moderate', validateObjectIdParameter('id'), validateBody(reviewModerationValidator), moderateReview)
router.delete('/:id', validateObjectIdParameter('id'), adminDeleteReview)
export default router
