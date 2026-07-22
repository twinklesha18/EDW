import { Router } from 'express'
import { listNotifications, markAllNotificationsRead, markNotificationRead } from '../controllers/notificationController.js'
import { protect } from '../middleware/authMiddleware.js'
import { validateObjectIdParameter } from '../middleware/validateMiddleware.js'

const router = Router()
router.use(protect)
router.get('/', listNotifications)
router.patch('/read-all', markAllNotificationsRead)
router.patch('/:id/read', validateObjectIdParameter('id'), markNotificationRead)
export default router
