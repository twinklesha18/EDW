import Counter from '../models/Counter.js'
import CustomOrder from '../models/CustomOrder.js'
import User from '../models/User.js'
import { deleteImage, uploadImage } from '../utils/cloudinaryUtils.js'
import { escapeRegex, paginationData, paginationFromQuery } from '../utils/queryUtils.js'
import { AppError, sendSuccess } from '../utils/responseUtils.js'

const customerFields = 'firstName lastName email phone avatar'

async function nextRequestNumber() {
  const year = new Date().getFullYear()
  const counter = await Counter.findOneAndUpdate(
    { _id: `custom-orders-${year}` },
    { $inc: { sequence: 1 } },
    { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true },
  )
  return `EDW-CUSTOM-${year}-${String(counter.sequence).padStart(5, '0')}`
}

const absoluteImage = (request, image) => image.url.startsWith('/')
  ? { ...image, url: `${request.protocol}://${request.get('host')}${image.url}` }
  : image

export async function createCustomOrder(request, response) {
  let inspiration = null
  try {
    if (request.file) inspiration = absoluteImage(request, await uploadImage(request.file, 'eshaz-dream-world/custom-orders'))
    const customOrder = await CustomOrder.create({
      requestNumber: await nextRequestNumber(),
      user: request.user._id,
      ...request.validatedBody,
      ...(inspiration && { inspiration }),
      statusHistory: [{ status: 'Pending', note: 'Custom-order request submitted by customer', updatedBy: request.user._id }],
    })
    await customOrder.populate('user', customerFields)
    return sendSuccess(response, { statusCode: 201, message: 'Custom-order request submitted successfully', data: { customOrder } })
  } catch (error) {
    if (inspiration?.publicId) await deleteImage(inspiration.publicId).catch(() => {})
    throw error
  }
}

export async function listMyCustomOrders(request, response) {
  const { page, limit, skip } = paginationFromQuery(request.query, { defaultLimit: 10 })
  const filter = { user: request.user._id }
  const [customOrders, total] = await Promise.all([
    CustomOrder.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    CustomOrder.countDocuments(filter),
  ])
  return sendSuccess(response, {
    message: 'Your custom orders were retrieved',
    data: { customOrders, pagination: paginationData(total, page, limit) },
  })
}

export async function listCustomOrders(request, response) {
  const { page, limit, skip } = paginationFromQuery(request.query, { defaultLimit: 10 })
  const filter = {}
  if (request.query.status) filter.status = request.query.status
  if (request.query.search) {
    const pattern = new RegExp(escapeRegex(String(request.query.search).slice(0, 100)), 'i')
    const customers = await User.find({ $or: [{ firstName: pattern }, { lastName: pattern }, { email: pattern }, { phone: pattern }] }).select('_id')
    filter.$or = [{ requestNumber: pattern }, { occasion: pattern }, { giftType: pattern }, { user: { $in: customers.map((customer) => customer._id) } }]
  }
  const [customOrders, total] = await Promise.all([
    CustomOrder.find(filter).populate('user', customerFields).sort({ createdAt: -1 }).skip(skip).limit(limit),
    CustomOrder.countDocuments(filter),
  ])
  return sendSuccess(response, { message: 'Custom orders retrieved', data: { customOrders, pagination: paginationData(total, page, limit) } })
}

export async function getCustomOrder(request, response) {
  const customOrder = await CustomOrder.findById(request.params.id)
    .populate('user', customerFields)
    .populate('statusHistory.updatedBy', 'firstName lastName role')
  if (!customOrder) throw new AppError('Custom order not found', 404)
  return sendSuccess(response, { message: 'Custom order retrieved', data: { customOrder } })
}

export async function updateCustomOrder(request, response) {
  const customOrder = await CustomOrder.findById(request.params.id).populate('user', customerFields)
  if (!customOrder) throw new AppError('Custom order not found', 404)
  const { status, adminNote, quotedPrice } = request.validatedBody
  if (status !== customOrder.status) {
    customOrder.statusHistory.push({ status, note: adminNote || `Request marked as ${status}`, updatedBy: request.user._id })
    customOrder.status = status
  }
  customOrder.adminNote = adminNote
  customOrder.quotedPrice = quotedPrice
  customOrder.respondedAt = new Date()
  await customOrder.save()
  return sendSuccess(response, { message: 'Custom order updated successfully', data: { customOrder } })
}
