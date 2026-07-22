import { Router } from 'express'
import { listUserDeletionLogs } from '../controllers/userDeletionLogController.js'

const router = Router()
router.get('/', listUserDeletionLogs)
export default router
