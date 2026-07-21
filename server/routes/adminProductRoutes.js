import { Router } from 'express'
import { adminGetProduct, adminListProducts, createProduct, deleteProduct, updateProduct } from '../controllers/productController.js'
import { productValidator, validateBody } from '../middleware/adminValidateMiddleware.js'
import { validateObjectIdParameter } from '../middleware/validateMiddleware.js'
const router = Router()
router.get('/', adminListProducts)
router.post('/', validateBody(productValidator), createProduct)
router.get('/:id', validateObjectIdParameter('id'), adminGetProduct)
router.put('/:id', validateObjectIdParameter('id'), validateBody(productValidator), updateProduct)
router.delete('/:id', validateObjectIdParameter('id'), deleteProduct)
export default router
