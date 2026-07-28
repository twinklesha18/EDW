import multer from 'multer'
import path from 'node:path'
import { AppError } from '../utils/responseUtils.js'

const extensionTypes = new Map([
  ['.jpg', new Set(['image/jpeg', 'image/jpg'])],
  ['.jpeg', new Set(['image/jpeg', 'image/jpg'])],
  ['.png', new Set(['image/png'])],
  ['.webp', new Set(['image/webp'])],
  ['.avif', new Set(['image/avif'])],
  ['.heic', new Set(['image/heic', 'image/heic-sequence', 'image/x-heic'])],
  ['.heif', new Set(['image/heif', 'image/heif-sequence', 'image/x-heif'])],
])

const validUploadName = (value) => {
  const name = String(value || '')
  return name.length > 0 && name.length <= 200 && !/[\u0000-\u001f\u007f/\\]/.test(name)
}

export const isAllowedImageMetadata = (file = {}) => {
  const extension = path.extname(file.originalname || '').toLowerCase()
  return validUploadName(file.originalname) && Boolean(extensionTypes.get(extension)?.has(String(file.mimetype || '').toLowerCase()))
}

export const imageUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 12 * 1024 * 1024,
    files: 1,
    fields: 10,
    parts: 12,
    fieldNameSize: 100,
    fieldSize: 20 * 1024,
  },
  fileFilter: (_request, file, callback) => {
    if (!isAllowedImageMetadata(file)) {
      return callback(new AppError('Upload a genuine JPEG, PNG, WebP, AVIF, HEIC, or HEIF image with a matching file extension', 422))
    }
    return callback(null, true)
  },
})
