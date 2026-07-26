import { Router } from 'express'
import {
  adminListContactMessages,
  adminListNewsletterSubscribers,
  markContactMessageRead,
} from '../controllers/communicationController.js'
import { validateObjectIdParameter } from '../middleware/validateMiddleware.js'

const router = Router()

router.get('/contact-messages', adminListContactMessages)
router.patch('/contact-messages/:id/read', validateObjectIdParameter('id'), markContactMessageRead)
router.get('/newsletter-subscribers', adminListNewsletterSubscribers)

export default router
