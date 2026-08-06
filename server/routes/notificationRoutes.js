import { Router } from 'express'
import { clearAdminNotifications, listNotifications, markAllNotificationsRead, markNotificationRead } from '../controllers/notificationController.js'
import { authorizeRoles, protect } from '../middleware/authMiddleware.js'
import { validateObjectIdParameter } from '../middleware/validateMiddleware.js'

const router = Router()
router.use(protect)
router.get('/', listNotifications)
router.patch('/read-all', markAllNotificationsRead)
router.delete('/', authorizeRoles('admin'), clearAdminNotifications)
router.patch('/:id/read', validateObjectIdParameter('id'), markNotificationRead)
export default router
