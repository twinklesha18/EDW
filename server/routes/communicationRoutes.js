import { Router } from 'express'
import { subscribeToNewsletter, submitContactMessage } from '../controllers/communicationController.js'
import { contactMessageValidator, newsletterSubscriptionValidator, validate } from '../middleware/validateMiddleware.js'
import { publicFormRateLimiter } from '../middleware/rateLimitMiddleware.js'

const router = Router()

router.post('/contact-messages', publicFormRateLimiter, validate(contactMessageValidator), submitContactMessage)
router.post('/newsletter-subscriptions', publicFormRateLimiter, validate(newsletterSubscriptionValidator), subscribeToNewsletter)

export default router
