import assert from 'node:assert/strict'
import { readFile, readdir } from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'
import app from '../app.js'
import { disconnectDatabase } from '../config/db.js'
import { contactMessageValidator } from '../middleware/validateMiddleware.js'
import { isAllowedImageMetadata } from '../middleware/uploadMiddleware.js'
import { detectImageSignature, prepareImageForUpload } from '../utils/cloudinaryUtils.js'

const clientOrigin = 'http://localhost:5173'
let server

const sourceFiles = async (directory) => {
  const entries = await readdir(directory, { withFileTypes: true })
  const nested = await Promise.all(entries.map(async (entry) => {
    const target = path.join(directory, entry.name)
    if (entry.isDirectory()) return sourceFiles(target)
    return /\.(?:js|jsx)$/.test(entry.name) ? [target] : []
  }))
  return nested.flat()
}

try {
  server = app.listen(0)
  await new Promise((resolve) => server.once('listening', resolve))
  const baseUrl = `http://127.0.0.1:${server.address().port}`

  let response = await fetch(`${baseUrl}/`)
  assert.equal(response.status, 200)
  assert.equal(response.headers.get('x-content-type-options'), 'nosniff')
  assert.equal(response.headers.get('x-frame-options'), 'SAMEORIGIN')
  assert.equal(response.headers.get('referrer-policy'), 'strict-origin-when-cross-origin')
  assert.match(response.headers.get('permissions-policy') || '', /camera=\(\)/)
  assert.equal(response.headers.get('x-powered-by'), null)

  response = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { Origin: clientOrigin, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'invalid@example.com', password: 'Password1' }),
  })
  assert.equal(response.status, 403, 'A browser mutation without a CSRF token must be rejected')

  response = await fetch(`${baseUrl}/api/auth/csrf-token`, { headers: { Origin: clientOrigin } })
  assert.equal(response.status, 200)
  const csrfCookie = response.headers.get('set-cookie')?.split(';')[0]
  const csrfPayload = await response.json()
  const csrfToken = csrfPayload.data.csrfToken
  assert.ok(csrfCookie?.startsWith('edw_csrf='))
  assert.match(csrfToken, /^[A-Za-z0-9_-]{43}\.[A-Za-z0-9_-]{43}$/)

  response = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: {
      Origin: clientOrigin,
      Cookie: csrfCookie,
      'Content-Type': 'application/json',
      'X-CSRF-Token': csrfToken,
    },
    body: JSON.stringify({ email: 'not-an-email', password: 'Password1' }),
  })
  assert.equal(response.status, 422, 'A valid CSRF token must allow the request to reach normal validation')

  response = await fetch(`${baseUrl}/api/auth/me`, {
    headers: { Origin: clientOrigin, Cookie: csrfCookie },
  })
  assert.equal(response.status, 401, 'An anonymous session must remain unauthenticated')
  const rotatedCsrfCookie = response.headers.getSetCookie().find((cookie) => cookie.startsWith('edw_csrf='))?.split(';')[0]
  const rotatedCsrfToken = response.headers.get('x-csrf-token')
  assert.ok(rotatedCsrfCookie, 'An expired or missing login session must receive a fresh CSRF cookie')
  assert.ok(rotatedCsrfToken && rotatedCsrfToken !== csrfToken, 'The stale CSRF token must be rotated')

  response = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: {
      Origin: clientOrigin,
      Cookie: rotatedCsrfCookie,
      'Content-Type': 'application/json',
      'X-CSRF-Token': rotatedCsrfToken,
    },
    body: JSON.stringify({ email: 'not-an-email', password: 'Password1' }),
  })
  assert.equal(response.status, 422, 'The refreshed CSRF token must immediately allow a login attempt')

  response = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: {
      Origin: 'https://attacker.example',
      Cookie: csrfCookie,
      'Content-Type': 'application/json',
      'X-CSRF-Token': csrfToken,
    },
    body: JSON.stringify({ email: 'invalid@example.com', password: 'Password1' }),
  })
  assert.equal(response.status, 403, 'Untrusted browser origins must be rejected')

  response = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: { $ne: null }, password: 'Password1' }),
  })
  assert.equal(response.status, 400, 'MongoDB operator keys must be rejected before reaching a query')

  response = await fetch(`${baseUrl}/?value=one&value=two`)
  assert.equal(response.status, 400, 'Repeated query parameters must be rejected')

  response = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain' },
    body: 'email=invalid@example.com&password=Password1',
  })
  assert.equal(response.status, 415, 'Simple cross-site content types must not be accepted by the JSON API')

  const xssValidation = contactMessageValidator({
    fullName: '<img src=x onerror=alert(1)> Customer',
    email: 'customer@example.com',
    phone: '0750894221',
    subject: '<script>alert(1)</script>Question',
    message: '<svg onload=alert(1)>This message contains enough ordinary text for validation.',
  })
  assert.equal(xssValidation.errors.length, 0)
  assert.doesNotMatch(JSON.stringify(xssValidation.values), /[<>]/)

  assert.equal(isAllowedImageMetadata({ originalname: 'photo.jpg', mimetype: 'image/jpeg' }), true)
  assert.equal(isAllowedImageMetadata({ originalname: 'photo.jpg', mimetype: 'image/png' }), false)
  assert.equal(isAllowedImageMetadata({ originalname: '../photo.jpg', mimetype: 'image/jpeg' }), false)
  assert.equal(detectImageSignature(Buffer.from('not an image')), '')

  const png = await sharp({ create: { width: 32, height: 32, channels: 4, background: '#f4bfd2' } }).png().toBuffer()
  const prepared = await prepareImageForUpload({ buffer: png, originalname: 'safe.png', mimetype: 'image/png' })
  assert.equal(detectImageSignature(prepared.buffer), 'webp')
  assert.ok(prepared.width <= 1800 && prepared.height <= 1800)
  await assert.rejects(
    prepareImageForUpload({ buffer: Buffer.from('<script>alert(1)</script>'), originalname: 'attack.jpg', mimetype: 'image/jpeg' }),
    /does not match its image type/,
  )

  const clientRoot = path.resolve(process.cwd(), '..', 'client')
  const vercel = JSON.parse(await readFile(path.join(clientRoot, 'vercel.json'), 'utf8'))
  const headers = vercel.headers.flatMap((rule) => rule.headers || [])
  const contentSecurityPolicy = headers.find((header) => header.key === 'Content-Security-Policy')?.value || ''
  assert.match(contentSecurityPolicy, /default-src 'self'/)
  assert.match(contentSecurityPolicy, /object-src 'none'/)
  assert.match(contentSecurityPolicy, /frame-ancestors 'none'/)

  const apiClientSource = await readFile(path.join(clientRoot, 'src', 'services', 'api.js'), 'utf8')
  assert.match(apiClientSource, /_csrfRetried/, 'The API client must prevent infinite CSRF retry loops')
  assert.match(apiClientSource, /obtainCsrfToken\(\{ force: true \}\)/, 'The API client must refresh a rejected CSRF token before retrying')

  for (const filename of await sourceFiles(path.join(clientRoot, 'src'))) {
    const source = await readFile(filename, 'utf8')
    assert.doesNotMatch(source, /dangerouslySetInnerHTML|\.innerHTML\s*=|\beval\s*\(|new\s+Function\s*\(/, `Unsafe HTML or code execution sink found in ${filename}`)
  }

  console.log('Security smoke test passed: headers, CSRF, origin checks, NoSQL operator rejection, parameter pollution, content types, XSS handling, upload verification, CSP, and frontend sinks are protected.')
} finally {
  if (server) await new Promise((resolve) => server.close(resolve))
  await disconnectDatabase()
}
