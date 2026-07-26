import { Router } from 'express'
import { subscribeToNewsletter, submitContactMessage } from '../controllers/communicationController.js'
import { contactMessageValidator, newsletterSubscriptionValidator, validate } from '../middleware/validateMiddleware.js'

const router = Router()

router.post('/contact-messages', validate(contactMessageValidator), submitContactMessage)
router.post('/newsletter-subscriptions', validate(newsletterSubscriptionValidator), subscribeToNewsletter)

export default router
