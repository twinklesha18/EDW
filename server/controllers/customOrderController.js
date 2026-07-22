import Counter from '../models/Counter.js'
import CustomOrder from '../models/CustomOrder.js'
import User from '../models/User.js'
import { getBankTransferConfig } from '../config/bankTransfer.js'
import { deleteImage, uploadImage } from '../utils/cloudinaryUtils.js'
import { escapeRegex, paginationData, paginationFromQuery } from '../utils/queryUtils.js'
import { AppError, sendSuccess } from '../utils/responseUtils.js'
import { notifyCustomOrderAdminEvent, notifyCustomOrderPayment, notifyCustomOrderPlaced, notifyCustomOrderStatus } from '../services/orderNotificationService.js'

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

const addressSnapshot = (address) => ({
  fullName: address.fullName,
  phone: address.phone,
  addressLine1: address.addressLine1,
  addressLine2: address.addressLine2 || '',
  city: address.city,
  district: address.district,
  province: address.province,
  postalCode: address.postalCode || '',
  country: address.country || 'Sri Lanka',
})

const canAcceptPayment = (customOrder) => customOrder.status === 'Quoted' && Number(customOrder.quotedPrice) > 0

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
    await notifyCustomOrderPlaced(customOrder, customOrder.user)
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

export async function getCustomOrderPaymentConfig(_request, response) {
  const bankTransfer = await getBankTransferConfig()
  return sendSuccess(response, {
    message: 'Custom-order payment options retrieved',
    data: {
      methods: bankTransfer.available ? ['COD', 'Bank Transfer'] : ['COD'],
      bankTransfer: bankTransfer.available ? bankTransfer : { available: false },
    },
  })
}

export async function getMyCustomOrder(request, response) {
  const customOrder = await CustomOrder.findOne({ _id: request.params.id, user: request.user._id })
  if (!customOrder) throw new AppError('Custom order not found', 404)
  return sendSuccess(response, { message: 'Custom order retrieved', data: { customOrder } })
}

export async function submitCustomOrderPayment(request, response) {
  const customOrder = await CustomOrder.findOne({ _id: request.params.id, user: request.user._id })
  if (!customOrder) throw new AppError('Custom order not found', 404)
  if (!canAcceptPayment(customOrder)) throw new AppError('Payment can be selected only after the owner sends a valid quote', 409)
  if (['Paid', 'COD Pending', 'COD Collected'].includes(customOrder.paymentStatus)) throw new AppError('Payment details have already been submitted for this custom order', 409)

  const { paymentMethod, addressId, paymentReference } = request.validatedBody
  const deliveryAddress = request.user.addresses.id(addressId)
  if (!deliveryAddress) throw new AppError('The selected saved delivery address was not found', 404)
  if (paymentMethod === 'Bank Transfer' && !(await getBankTransferConfig()).available) throw new AppError('Bank transfer is not available until the owner configures the bank account details', 503)

  let uploadedSlip = null
  const previousSlipPublicId = customOrder.paymentSlip?.publicId
  const previousStatus = customOrder.status
  try {
    if (paymentMethod === 'Bank Transfer') uploadedSlip = absoluteImage(request, await uploadImage(request.file, 'eshaz-dream-world/payment-slips'))
    customOrder.paymentMethod = paymentMethod
    customOrder.paymentReference = paymentReference
    customOrder.deliveryAddress = addressSnapshot(deliveryAddress)
    customOrder.paymentSubmittedAt = new Date()

    if (paymentMethod === 'COD') {
      customOrder.paymentStatus = 'COD Pending'
      customOrder.paymentSlip = undefined
      customOrder.status = 'Approved'
      customOrder.statusHistory.push({ status: 'Approved', note: 'Customer accepted the quote with Cash on Delivery', updatedBy: request.user._id })
      customOrder.paymentHistory.push({ status: 'COD Pending', note: 'Cash on Delivery selected by customer', updatedBy: request.user._id })
    } else {
      customOrder.paymentStatus = 'Slip Submitted'
      customOrder.paymentSlip = uploadedSlip
      customOrder.paymentHistory.push({ status: 'Slip Submitted', note: paymentReference ? `Bank transfer slip submitted with reference ${paymentReference}` : 'Bank transfer slip submitted for verification', updatedBy: request.user._id })
    }

    await customOrder.save()
    if (previousSlipPublicId && previousSlipPublicId !== uploadedSlip?.publicId) await deleteImage(previousSlipPublicId).catch(() => {})
    await Promise.all([
      notifyCustomOrderPayment(customOrder, request.user, paymentMethod === 'COD' ? 'Cash on Delivery was selected.' : 'Your payment slip was submitted for verification.'),
      notifyCustomOrderAdminEvent(customOrder, `Payment submitted for ${customOrder.requestNumber}`, `${request.user.firstName} ${request.user.lastName} selected ${paymentMethod}${paymentMethod === 'Bank Transfer' ? ' and uploaded a payment slip' : ''}.`),
      ...(customOrder.status !== previousStatus ? [notifyCustomOrderStatus(customOrder, request.user)] : []),
    ])
    return sendSuccess(response, { message: paymentMethod === 'COD' ? 'Cash on Delivery selected successfully' : 'Payment slip submitted for administrator verification', data: { customOrder } })
  } catch (error) {
    if (uploadedSlip?.publicId) await deleteImage(uploadedSlip.publicId).catch(() => {})
    throw error
  }
}

export async function cancelMyCustomOrder(request, response) {
  const customOrder = await CustomOrder.findOne({ _id: request.params.id, user: request.user._id })
  if (!customOrder) throw new AppError('Custom order not found', 404)
  if (!['Pending', 'Reviewing', 'Quoted'].includes(customOrder.status) || customOrder.paymentStatus === 'Paid') throw new AppError('This custom order can no longer be cancelled online', 409)
  customOrder.status = 'Cancelled'
  customOrder.statusHistory.push({ status: 'Cancelled', note: 'Cancelled by customer', updatedBy: request.user._id })
  await customOrder.save()
  await Promise.all([
    notifyCustomOrderStatus(customOrder, request.user, 'Your custom-order request was cancelled.'),
    notifyCustomOrderAdminEvent(customOrder, `Custom request ${customOrder.requestNumber} cancelled`, `${request.user.firstName} ${request.user.lastName} cancelled this custom-order request.`),
  ])
  return sendSuccess(response, { message: 'Custom order cancelled successfully', data: { customOrder } })
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
    .populate('paymentHistory.updatedBy', 'firstName lastName role')
  if (!customOrder) throw new AppError('Custom order not found', 404)
  return sendSuccess(response, { message: 'Custom order retrieved', data: { customOrder } })
}

export async function updateCustomOrder(request, response) {
  const customOrder = await CustomOrder.findById(request.params.id).populate('user', customerFields)
  if (!customOrder) throw new AppError('Custom order not found', 404)
  const { status, adminNote, quotedPrice, trackingNumber, estimatedDelivery } = request.validatedBody
  const previousStatus = customOrder.status
  const previousQuotedPrice = Number(customOrder.quotedPrice || 0)
  const previousTrackingNumber = customOrder.trackingNumber
  const quoteLocked = !['Not Selected', 'Payment Rejected'].includes(customOrder.paymentStatus)
  if (quoteLocked && Number(quotedPrice) !== Number(customOrder.quotedPrice)) throw new AppError('The quoted price cannot be changed after the customer submits payment details', 409)
  if (status !== customOrder.status && ['Approved', 'In Progress', 'Completed'].includes(status)) {
    const acceptedPayment = customOrder.paymentMethod === 'COD'
      ? ['COD Pending', 'COD Collected'].includes(customOrder.paymentStatus)
      : customOrder.paymentMethod === 'Bank Transfer' && customOrder.paymentStatus === 'Paid'
    if (!acceptedPayment) throw new AppError('Verify payment or wait for the customer to select Cash on Delivery before progressing this order', 409)
  }
  if (status !== customOrder.status) {
    customOrder.statusHistory.push({ status, note: adminNote || `Request marked as ${status}`, updatedBy: request.user._id })
    customOrder.status = status
  }
  customOrder.adminNote = adminNote
  customOrder.quotedPrice = quotedPrice
  customOrder.trackingNumber = trackingNumber
  customOrder.estimatedDelivery = estimatedDelivery
  customOrder.respondedAt = new Date()
  await customOrder.save()
  if (customOrder.user) {
    if (customOrder.status !== previousStatus) await notifyCustomOrderStatus(customOrder, customOrder.user, adminNote || `Your custom-order status changed to ${customOrder.status}.`)
    else if (Number(customOrder.quotedPrice || 0) !== previousQuotedPrice) await notifyCustomOrderStatus(customOrder, customOrder.user, `A quote of LKR ${Number(customOrder.quotedPrice).toLocaleString('en-LK')} is ready for your custom order.`)
    else if (customOrder.trackingNumber && customOrder.trackingNumber !== previousTrackingNumber) await notifyCustomOrderStatus(customOrder, customOrder.user, `Tracking was updated: ${customOrder.trackingNumber}.`)
  }
  return sendSuccess(response, { message: 'Custom order updated successfully', data: { customOrder } })
}

export async function reviewCustomOrderPayment(request, response) {
  const customOrder = await CustomOrder.findById(request.params.id).populate('user', customerFields)
  if (!customOrder) throw new AppError('Custom order not found', 404)
  const { action, note } = request.validatedBody
  const previousStatus = customOrder.status

  if (action === 'approve') {
    if (customOrder.paymentMethod !== 'Bank Transfer' || customOrder.paymentStatus !== 'Slip Submitted' || !customOrder.paymentSlip?.url) throw new AppError('There is no submitted bank slip awaiting approval', 409)
    customOrder.paymentStatus = 'Paid'
    customOrder.paymentVerifiedAt = new Date()
    customOrder.paymentHistory.push({ status: 'Paid', note: note || 'Bank transfer verified by administrator', updatedBy: request.user._id })
    if (customOrder.status === 'Quoted') {
      customOrder.status = 'Approved'
      customOrder.statusHistory.push({ status: 'Approved', note: 'Bank transfer verified and quote approved', updatedBy: request.user._id })
    }
  } else if (action === 'reject') {
    if (customOrder.paymentMethod !== 'Bank Transfer' || customOrder.paymentStatus !== 'Slip Submitted') throw new AppError('There is no submitted bank slip awaiting review', 409)
    customOrder.paymentStatus = 'Payment Rejected'
    customOrder.paymentVerifiedAt = null
    customOrder.paymentHistory.push({ status: 'Payment Rejected', note, updatedBy: request.user._id })
  } else {
    if (customOrder.paymentMethod !== 'COD' || customOrder.paymentStatus !== 'COD Pending') throw new AppError('This custom order is not awaiting Cash on Delivery collection', 409)
    customOrder.paymentStatus = 'COD Collected'
    customOrder.paymentVerifiedAt = new Date()
    customOrder.paymentHistory.push({ status: 'COD Collected', note: note || 'Cash on Delivery payment collected', updatedBy: request.user._id })
  }

  await customOrder.save()
  if (customOrder.user) {
    await notifyCustomOrderPayment(customOrder, customOrder.user, note)
    if (customOrder.status !== previousStatus) await notifyCustomOrderStatus(customOrder, customOrder.user)
  }
  return sendSuccess(response, { message: 'Custom-order payment updated successfully', data: { customOrder } })
}
