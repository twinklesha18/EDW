import sharp from 'sharp'
import { env } from '../config/env.js'

const maximumLogoBytes = 5 * 1024 * 1024

const allowedLogoUrl = (value) => {
  try {
    const candidate = new URL(value)
    const serverOrigin = new URL(env.serverUrl).origin
    if (candidate.origin === serverOrigin) return true
    if (candidate.protocol !== 'https:' || candidate.hostname !== 'res.cloudinary.com') return false
    return !env.cloudinary.cloudName || candidate.pathname.startsWith(`/${env.cloudinary.cloudName}/`)
  } catch {
    return false
  }
}

export async function normalizeInvoiceLogo(buffer) {
  if (!Buffer.isBuffer(buffer) || !buffer.length || buffer.length > maximumLogoBytes) throw new Error('Invalid invoice logo buffer')
  return sharp(buffer, { limitInputPixels: 25_000_000 })
    .rotate()
    .resize({ width: 512, height: 512, fit: 'inside', withoutEnlargement: true })
    .png({ compressionLevel: 9 })
    .toBuffer()
}

export async function fetchInvoiceLogo(value) {
  if (!allowedLogoUrl(value)) return null
  try {
    const response = await fetch(value, {
      headers: { Accept: 'image/png,image/jpeg,image/webp,image/avif' },
      redirect: 'follow',
      signal: AbortSignal.timeout(7000),
    })
    if (!response.ok || !allowedLogoUrl(response.url)) return null
    const contentType = String(response.headers.get('content-type') || '').toLowerCase()
    const contentLength = Number(response.headers.get('content-length') || 0)
    if (!contentType.startsWith('image/') || contentLength > maximumLogoBytes) return null
    const source = Buffer.from(await response.arrayBuffer())
    if (source.length > maximumLogoBytes) return null
    return await normalizeInvoiceLogo(source)
  } catch {
    return null
  }
}
