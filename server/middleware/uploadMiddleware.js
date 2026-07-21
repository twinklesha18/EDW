import multer from 'multer'
import path from 'node:path'
import { AppError } from '../utils/responseUtils.js'

const allowedTypes = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/avif', 'image/heic', 'image/heif', 'image/heic-sequence', 'image/heif-sequence', 'image/x-heic', 'image/x-heif'])
const allowedExtensions = new Set(['.jpg', '.jpeg', '.png', '.webp', '.avif', '.heic', '.heif'])
export const imageUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 12 * 1024 * 1024, files: 1 },
  fileFilter: (_request, file, callback) => allowedTypes.has(file.mimetype) || allowedExtensions.has(path.extname(file.originalname).toLowerCase()) ? callback(null, true) : callback(new AppError('Only JPEG, PNG, WebP, AVIF, HEIC, and HEIF images are allowed', 422)),
})
