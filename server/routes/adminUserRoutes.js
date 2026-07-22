import { Router } from 'express'
import { changeUserPassword, createUser, createUserPasswordReset, deleteUser, getUser, listUsers, updateUser, updateUserAccess } from '../controllers/adminUserController.js'
import { adminUserCreateValidator, adminUserPasswordValidator, adminUserUpdateValidator, userAdminValidator, validateBody } from '../middleware/adminValidateMiddleware.js'
import { validateObjectIdParameter } from '../middleware/validateMiddleware.js'
const router = Router()
router.get('/', listUsers)
router.post('/', validateBody(adminUserCreateValidator), createUser)
router.put('/:id/access', validateObjectIdParameter('id'), validateBody(userAdminValidator), updateUserAccess)
router.put('/:id/password', validateObjectIdParameter('id'), validateBody(adminUserPasswordValidator), changeUserPassword)
router.post('/:id/password-reset', validateObjectIdParameter('id'), createUserPasswordReset)
router.get('/:id', validateObjectIdParameter('id'), getUser)
router.put('/:id', validateObjectIdParameter('id'), validateBody(adminUserUpdateValidator), updateUser)
router.delete('/:id', validateObjectIdParameter('id'), deleteUser)
export default router
