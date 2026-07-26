import sharp from 'sharp'
import { env } from '../config/env.js'

const maximumSlipBytes = 12 * 1024 * 1024

const allowedSlipUrl = (value) => {
  try {
    const candidate = new URL(value)
    const serverOrigin = new URL(env.serverUrl).origin
    if (candidate.origin === serverOrigin) return true
    if (!env.isProduction && ['localhost', '127.0.0.1', '[::1]'].includes(candidate.hostname)) return true
    if (candidate.protocol !== 'https:' || candidate.hostname !== 'res.cloudinary.com') return false
    return !env.cloudinary.cloudName || candidate.pathname.startsWith(`/${env.cloudinary.cloudName}/`)
  } catch {
    return false
  }
}

export async function loadPaymentSlip(value) {
  if (!allowedSlipUrl(value)) return null
  try {
    const response = await fetch(value, {
      headers: { Accept: 'image/png,image/jpeg,image/webp,image/avif' },
      redirect: 'error',
      signal: AbortSignal.timeout(10000),
    })
    if (!response.ok || !allowedSlipUrl(response.url)) return null
    const contentType = String(response.headers.get('content-type') || '').toLowerCase()
    const contentLength = Number(response.headers.get('content-length') || 0)
    if (!contentType.startsWith('image/') || contentLength > maximumSlipBytes) return null
    const source = Buffer.from(await response.arrayBuffer())
    if (!source.length || source.length > maximumSlipBytes) return null
    const buffer = await sharp(source, { limitInputPixels: 40_000_000 })
      .rotate()
      .resize({ width: 2200, height: 2200, fit: 'inside', withoutEnlargement: true })
      .png({ compressionLevel: 8 })
      .toBuffer()
    return { buffer, contentType: 'image/png' }
  } catch {
    return null
  }
}
