import mongoose from 'mongoose'
import { PHONE_VALIDATION_MESSAGE, isValidPhone, normalizePhone } from '../utils/inputValidation.js'

export const CUSTOM_ORDER_STATUSES = [
  'Pending',
  'Reviewing',
  'Quoted',
  'Approved',
  'In Progress',
  'Completed',
  'Rejected',
  'Cancelled',
]
export const CUSTOM_ORDER_PAYMENT_METHODS = ['COD', 'Bank Transfer']
export const CUSTOM_ORDER_PAYMENT_STATUSES = ['Not Selected', 'COD Pending', 'Slip Submitted', 'Paid', 'Payment Rejected', 'COD Collected', 'Refunded']

const inspirationSchema = new mongoose.Schema({
  url: { type: String, trim: true, maxlength: 800, default: '' },
  publicId: { type: String, trim: true, maxlength: 300, default: '' },
  width: { type: Number, min: 0, default: 0 },
  height: { type: Number, min: 0, default: 0 },
  bytes: { type: Number, min: 0, default: 0 },
  storage: { type: String, enum: ['local', 'cloudinary', ''], default: '' },
}, { _id: false })

const deliveryAddressSchema = new mongoose.Schema({
  fullName: { type: String, trim: true, maxlength: 120, default: '' },
  phone: { type: String, trim: true, maxlength: 10, default: '', set: normalizePhone, validate: { validator: (value) => !value || isValidPhone(value), message: PHONE_VALIDATION_MESSAGE } },
  addressLine1: { type: String, trim: true, maxlength: 150, default: '' },
  addressLine2: { type: String, trim: true, maxlength: 150, default: '' },
  city: { type: String, trim: true, maxlength: 80, default: '' },
  district: { type: String, trim: true, maxlength: 80, default: '' },
  province: { type: String, trim: true, maxlength: 80, default: '' },
  postalCode: { type: String, trim: true, maxlength: 20, default: '' },
  country: { type: String, trim: true, maxlength: 80, default: 'Sri Lanka' },
}, { _id: false })

const statusHistorySchema = new mongoose.Schema({
  status: { type: String, enum: CUSTOM_ORDER_STATUSES, required: true },
  note: { type: String, trim: true, maxlength: 1000, default: '' },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  timestamp: { type: Date, default: Date.now, required: true },
}, { _id: true })

const paymentHistorySchema = new mongoose.Schema({
  status: { type: String, enum: CUSTOM_ORDER_PAYMENT_STATUSES, required: true },
  note: { type: String, trim: true, maxlength: 1000, default: '' },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  timestamp: { type: Date, default: Date.now, required: true },
}, { _id: true })

const customOrderSchema = new mongoose.Schema({
  requestNumber: { type: String, required: true, unique: true, uppercase: true, index: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  occasion: { type: String, required: true, trim: true, maxlength: 80 },
  requiredDate: { type: Date, required: true, index: true },
  budgetRange: { type: String, required: true, trim: true, maxlength: 80 },
  preferredColors: { type: String, required: true, trim: true, maxlength: 200 },
  giftType: { type: String, required: true, trim: true, maxlength: 80 },
  bouquetType: { type: String, trim: true, maxlength: 80, default: '' },
  specialMessage: { type: String, trim: true, maxlength: 500, default: '' },
  description: { type: String, required: true, trim: true, minlength: 20, maxlength: 3000 },
  inspiration: { type: inspirationSchema, default: () => ({}) },
  status: { type: String, enum: CUSTOM_ORDER_STATUSES, default: 'Pending', index: true },
  quotedPrice: { type: Number, min: 0, default: null },
  paymentMethod: { type: String, enum: ['', ...CUSTOM_ORDER_PAYMENT_METHODS], default: '', index: true },
  paymentStatus: { type: String, enum: CUSTOM_ORDER_PAYMENT_STATUSES, default: 'Not Selected', index: true },
  paymentReference: { type: String, trim: true, maxlength: 120, default: '' },
  paymentSlip: { type: inspirationSchema, default: () => ({}) },
  paymentSubmittedAt: { type: Date, default: null },
  paymentVerifiedAt: { type: Date, default: null },
  paymentHistory: { type: [paymentHistorySchema], default: [] },
  deliveryAddress: { type: deliveryAddressSchema, default: () => ({}) },
  trackingNumber: { type: String, trim: true, maxlength: 120, default: '' },
  estimatedDelivery: { type: Date, default: null },
  adminNote: { type: String, trim: true, maxlength: 1000, default: '' },
  respondedAt: { type: Date, default: null },
  statusHistory: { type: [statusHistorySchema], default: [] },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
})

customOrderSchema.index({ createdAt: -1, status: 1 })
customOrderSchema.index({ user: 1, createdAt: -1 })

const CustomOrder = mongoose.model('CustomOrder', customOrderSchema)
export default CustomOrder
