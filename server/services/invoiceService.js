import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import PDFDocument from 'pdfkit'

const currentDir = path.dirname(fileURLToPath(import.meta.url))
const logoPath = path.resolve(currentDir, '../../client/src/assets/images/eshaz-dream-world-logo.png')
const money = (value) => `LKR ${Number(value).toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

export function streamInvoice(order, response) {
  const doc = new PDFDocument({ size: 'A4', margin: 48, info: { Title: `Invoice ${order.orderNumber}`, Author: 'Eshaz Dream World' } })
  response.setHeader('Content-Type', 'application/pdf')
  response.setHeader('Content-Disposition', `attachment; filename="${order.orderNumber}-invoice.pdf"`)
  doc.pipe(response)
  if (fs.existsSync(logoPath)) doc.image(logoPath, 48, 42, { fit: [72, 72] })
  doc.fillColor('#7d2948').font('Times-Bold').fontSize(24).text('Eshaz Dream World', 135, 52)
  doc.fillColor('#8e7a81').font('Helvetica').fontSize(9).text('YOUR DESTINATION | MY PASSION', 135, 82)
  doc.fillColor('#33252a').font('Times-Bold').fontSize(22).text('INVOICE', 400, 52, { align: 'right' })
  doc.font('Helvetica').fontSize(10).text(order.orderNumber, 350, 82, { align: 'right' })
  doc.moveTo(48, 128).lineTo(547, 128).strokeColor('#d9b46f').stroke()
  const customer = order.user
  doc.fillColor('#33252a').font('Helvetica-Bold').fontSize(11).text('BILLED TO', 48, 150)
  doc.font('Helvetica').fontSize(10).fillColor('#65545b').text(`${customer?.firstName || order.shippingAddress.fullName} ${customer?.lastName || ''}`.trim(), 48, 170).text(customer?.email || '', 48, 186).text(order.shippingAddress.phone, 48, 202)
  doc.font('Helvetica-Bold').fillColor('#33252a').text('DELIVERY ADDRESS', 300, 150)
  doc.font('Helvetica').fillColor('#65545b').text(order.shippingAddress.fullName, 300, 170).text(order.shippingAddress.addressLine1, 300, 186).text(`${order.shippingAddress.city}, ${order.shippingAddress.district}`, 300, 202).text(`${order.shippingAddress.province}, Sri Lanka`, 300, 218)
  doc.font('Helvetica-Bold').fillColor('#33252a').text('ITEM', 48, 260).text('QTY', 350, 260).text('UNIT PRICE', 400, 260).text('TOTAL', 495, 260, { align: 'right' })
  doc.moveTo(48, 278).lineTo(547, 278).strokeColor('#eaded8').stroke()
  let y = 292
  for (const item of order.items) {
    if (y > 690) { doc.addPage(); y = 60 }
    doc.font('Helvetica-Bold').fontSize(10).fillColor('#33252a').text(item.name, 48, y, { width: 280 })
    doc.font('Helvetica').fontSize(8).fillColor('#8e7a81').text(`Size: ${item.size}`, 48, y + 15)
    doc.fontSize(10).fillColor('#33252a').text(String(item.quantity), 350, y).text(money(item.price), 400, y).text(money(item.price * item.quantity), 465, y, { width: 82, align: 'right' })
    y += 42
  }
  y += 12
  doc.moveTo(300, y).lineTo(547, y).strokeColor('#eaded8').stroke(); y += 16
  const row = (label, value, bold = false) => { doc.font(bold ? 'Helvetica-Bold' : 'Helvetica').fontSize(bold ? 12 : 10).fillColor(bold ? '#7d2948' : '#65545b').text(label, 320, y).text(value, 430, y, { width: 117, align: 'right' }); y += bold ? 24 : 19 }
  row('Subtotal', money(order.subtotal)); row('Shipping', money(order.shippingFee)); row('Discount', `-${money(order.discount)}`); row('Grand Total', money(order.total), true)
  y += 12
  doc.font('Helvetica').fontSize(9).fillColor('#65545b').text(`Payment: ${order.paymentMethod} · ${order.paymentStatus}`, 48, y).text(`Invoice date: ${new Date(order.createdAt).toLocaleDateString('en-LK')}`, 48, y + 16)
  doc.font('Times-Italic').fontSize(10).fillColor('#7d2948').text('Thank you for choosing Eshaz Dream World.', 48, 760, { width: 499, align: 'center' })
  doc.end()
}
