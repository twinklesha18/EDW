import { randomUUID } from 'node:crypto'
import { mkdir, unlink, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import heicConvert from 'heic-convert'
import sharp from 'sharp'
import cloudinary, { isCloudinaryConfigured } from '../config/cloudinary.js'
import { env } from '../config/env.js'
import { AppError } from './responseUtils.js'

const currentDirectory = path.dirname(fileURLToPath(import.meta.url))
const uploadsRoot = path.resolve(currentDirectory, '..', 'uploads')
const allowedFolders = new Set(['products', 'categories', 'banners', 'settings', 'custom-orders', 'payment-slips'])
const heicTypes = new Set(['image/heic', 'image/heif', 'image/heic-sequence', 'image/heif-sequence', 'image/x-heic', 'image/x-heif'])
const maximumInputPixels = 40_000_000

export const detectImageSignature = (buffer) => {
  if (!Buffer.isBuffer(buffer) || buffer.length < 12) return ''
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return 'jpeg'
  if (buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'png'
  if (buffer.subarray(0, 4).toString('ascii') === 'RIFF' && buffer.subarray(8, 12).toString('ascii') === 'WEBP') return 'webp'
  if (buffer.subarray(4, 8).toString('ascii') === 'ftyp') {
    const brands = buffer.subarray(8, Math.min(buffer.length, 40)).toString('ascii')
    if (/(?:avif|avis)/.test(brands)) return 'avif'
    if (/(?:heic|heix|hevc|hevx|heim|heis|mif1|msf1)/.test(brands)) return 'heic'
  }
  return ''
}

const declaredType = (file) => {
  const mime = String(file.mimetype || '').toLowerCase()
  if (['image/jpeg', 'image/jpg'].includes(mime)) return 'jpeg'
  if (mime === 'image/png') return 'png'
  if (mime === 'image/webp') return 'webp'
  if (mime === 'image/avif') return 'avif'
  if (heicTypes.has(mime)) return 'heic'
  return ''
}

const verifyImageSignature = (file) => {
  const detected = detectImageSignature(file.buffer)
  if (!detected || detected !== declaredType(file)) throw new AppError('The uploaded file content does not match its image type', 422)
}

const uploadFolder = (folder) => {
  const candidate = path.basename(String(folder || '')).toLowerCase()
  return allowedFolders.has(candidate) ? candidate : 'products'
}

async function sourceBuffer(file) {
  verifyImageSignature(file)
  const extension = path.extname(file.originalname || '').toLowerCase()
  const isHeic = heicTypes.has(file.mimetype) || ['.heic', '.heif'].includes(extension)
  if (!isHeic) return file.buffer
  try {
    return Buffer.from(await heicConvert({ buffer: file.buffer, format: 'JPEG', quality: 0.9 }))
  } catch {
    throw new AppError('This phone photo could not be converted. Please select a different photo or save it as JPEG.', 422)
  }
}

export async function prepareImageForUpload(file) {
  try {
    const buffer = await sharp(await sourceBuffer(file), { limitInputPixels: maximumInputPixels, failOn: 'warning' })
      .rotate()
      .resize({ width: 1800, height: 1800, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer()
    const metadata = await sharp(buffer).metadata()
    return { buffer, width: metadata.width, height: metadata.height }
  } catch (error) {
    if (error instanceof AppError) throw error
    throw new AppError('The selected file is not a readable image', 422)
  }
}

async function uploadLocally(file, folder) {
  const targetFolder = uploadFolder(folder)
  const directory = path.join(uploadsRoot, targetFolder)
  await mkdir(directory, { recursive: true })
  const filename = `${Date.now()}-${randomUUID()}.webp`
  const { buffer, width, height } = await prepareImageForUpload(file)
  await writeFile(path.join(directory, filename), buffer, { flag: 'wx' })
  return {
    url: `/uploads/${targetFolder}/${filename}`,
    publicId: `local:${targetFolder}/${filename}`,
    width,
    height,
    bytes: buffer.length,
    storage: 'local',
  }
}

export async function uploadImage(file, folder = 'eshaz-dream-world/products') {
  if (!isCloudinaryConfigured) {
    if (env.isProduction) throw new AppError('Cloudinary must be configured for production image uploads', 503)
    return uploadLocally(file, folder)
  }

  const { buffer } = await prepareImageForUpload(file)
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream({ folder, resource_type: 'image', format: 'webp', quality: 'auto:good' }, (error, result) => {
      if (error) reject(new AppError('Image upload failed', 502))
      else resolve({ url: result.secure_url, publicId: result.public_id, width: result.width, height: result.height, bytes: result.bytes, storage: 'cloudinary' })
    })
    stream.end(buffer)
  })
}

async function deleteLocalImage(publicId) {
  const relativePath = publicId.slice('local:'.length).replaceAll('\\', '/')
  if (!/^(products|categories|banners|settings|custom-orders|payment-slips)\/[a-zA-Z0-9-]+\.webp$/.test(relativePath)) throw new AppError('Invalid local image identifier', 400)
  const target = path.resolve(uploadsRoot, ...relativePath.split('/'))
  if (!target.startsWith(`${uploadsRoot}${path.sep}`)) throw new AppError('Invalid local image identifier', 400)
  try { await unlink(target) } catch (error) { if (error.code !== 'ENOENT') throw error }
  return { result: 'ok' }
}

export async function deleteImage(publicId) {
  if (String(publicId || '').startsWith('local:')) return deleteLocalImage(publicId)
  if (!isCloudinaryConfigured) throw new AppError('Cloudinary is not configured on this server', 503)
  if (!publicId || !publicId.startsWith('eshaz-dream-world/')) throw new AppError('Invalid image identifier', 400)
  const result = await cloudinary.uploader.destroy(publicId, { resource_type: 'image', invalidate: true })
  if (!['ok', 'not found'].includes(result.result)) throw new AppError('Image could not be removed', 502)
  return result
}
