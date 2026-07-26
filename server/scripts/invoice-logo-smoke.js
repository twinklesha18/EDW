import assert from 'node:assert/strict'
import { PassThrough } from 'node:stream'
import sharp from 'sharp'
import { normalizeInvoiceLogo } from '../services/invoiceBrandingService.js'
import { streamInvoice } from '../services/invoiceService.js'

const webpLogo = await sharp({
  create: { width: 160, height: 160, channels: 4, background: { r: 246, g: 184, b: 206, alpha: 1 } },
}).webp().toBuffer()
const normalizedLogo = await normalizeInvoiceLogo(webpLogo)
const metadata = await sharp(normalizedLogo).metadata()
assert.equal(metadata.format, 'png', 'Managed WebP logos must be converted to PNG for PDFKit')

const order = {
  orderNumber: 'EDW-INVOICE-LOGO-TEST',
  createdAt: new Date('2026-07-26T00:00:00.000Z'),
  user: { firstName: 'Invoice', lastName: 'Customer', email: 'customer@example.com' },
  shippingAddress: { fullName: 'Invoice Customer', phone: '0712345678', addressLine1: '1 Test Road', city: 'Ampara', district: 'Ampara', province: 'Eastern' },
  items: [{ name: 'Test Bouquet', size: 'M', price: 2500, quantity: 1 }],
  subtotal: 2500,
  shippingFee: 450,
  total: 2950,
  paymentMethod: 'COD',
  paymentStatus: 'Paid',
}
const generatePdf = async (logo) => {
  const response = new PassThrough()
  const headers = new Map()
  const chunks = []
  response.setHeader = (key, value) => headers.set(key.toLowerCase(), value)
  response.on('data', (chunk) => chunks.push(chunk))
  const finished = new Promise((resolve, reject) => { response.on('end', resolve); response.on('error', reject) })
  streamInvoice(order, response, { business: { name: 'Eshaz Dream World', tagline: 'Your Destination | My Passion' } }, logo)
  await finished
  return { headers, pdf: Buffer.concat(chunks) }
}

for (const logo of [normalizedLogo, Buffer.from('not-an-image')]) {
  const { headers, pdf } = await generatePdf(logo)
  assert.equal(headers.get('content-type'), 'application/pdf')
  assert.match(pdf.subarray(0, 8).toString('ascii'), /^%PDF-/)
  assert.ok(pdf.length > 1000, 'The generated invoice must contain PDF data')
}

console.log('Invoice logo smoke test passed: WebP conversion, PDF embedding, and invalid-logo fallback all produce downloadable invoices.')
