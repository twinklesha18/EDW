import { Router } from 'express'
import { listUsers, updateUserAccess } from '../controllers/adminUserController.js'
import { userAdminValidator, validateBody } from '../middleware/adminValidateMiddleware.js'
import { validateObjectIdParameter } from '../middleware/validateMiddleware.js'
const router = Router()
router.get('/', listUsers)
router.put('/:id/access', validateObjectIdParameter('id'), validateBody(userAdminValidator), updateUserAccess)
export default router
