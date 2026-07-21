import { Router } from 'express'
import { adminListCategories, createCategory, deleteCategory, updateCategory } from '../controllers/categoryController.js'
import { categoryValidator, validateBody } from '../middleware/adminValidateMiddleware.js'
import { validateObjectIdParameter } from '../middleware/validateMiddleware.js'
const router = Router()
router.get('/', adminListCategories)
router.post('/', validateBody(categoryValidator), createCategory)
router.put('/:id', validateObjectIdParameter('id'), validateBody(categoryValidator), updateCategory)
router.delete('/:id', validateObjectIdParameter('id'), deleteCategory)
export default router
