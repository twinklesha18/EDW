import { Router } from 'express'
import { removeCloudinaryImage, uploadSingleImage } from '../controllers/uploadController.js'
import { imageUpload } from '../middleware/uploadMiddleware.js'
const router = Router()
router.post('/single', imageUpload.single('image'), uploadSingleImage)
router.delete('/', removeCloudinaryImage)
export default router
