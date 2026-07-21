import mongoose from 'mongoose'

export const ORDER_STATUSES = ['Pending', 'Confirmed', 'Processing', 'Packed', 'Shipped', 'Delivered', 'Cancelled']
export const PAYMENT_STATUSES = ['Pending', 'Paid', 'Failed', 'Refunded']
export const REFUND_STATUSES = ['Pending', 'Approved', 'Rejected', 'Processed']

const addressSchema = new mongoose.Schema({
  fullName: { type: String, required: true, trim: true }, phone: { type: String, required: true, trim: true },
  addressLine1: { type: String, required: true, trim: true }, addressLine2: { type: String, trim: true, default: '' },
  city: { type: String, required: true, trim: true }, district: { type: String, required: true, trim: true }, province: { type: String, required: true, trim: true },
  postalCode: { type: String, trim: true, default: '' }, country: { type: String, trim: true, default: 'Sri Lanka' },
}, { _id: false })

const orderItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  name: { type: String, required: true, trim: true }, slug: { type: String, trim: true, default: '' }, size: { type: String, enum: ['S', 'M', 'L'], default: 'M' }, image: { type: String, trim: true, default: '' },
  price: { type: Number, required: true, min: 0 }, quantity: { type: Number, required: true, min: 1 },
  customization: { message: String, preferredColor: String, notes: String },
}, { _id: true })

const timelineSchema = new mongoose.Schema({
  status: { type: String, enum: ORDER_STATUSES, required: true },
  timestamp: { type: Date, default: Date.now, required: true },
  note: { type: String, trim: true, maxlength: 500, default: '' },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
}, { _id: true })

const refundSchema = new mongoose.Schema({
  amount: { type: Number, min: 0, required: true },
  reason: { type: String, trim: true, maxlength: 500, required: true },
  status: { type: String, enum: REFUND_STATUSES, default: 'Pending' },
  requestedAt: { type: Date, default: Date.now },
  processedAt: { type: Date, default: null },
}, { _id: true })

const orderSchema = new mongoose.Schema({
  orderNumber: { type: String, required: true, unique: true, uppercase: true, index: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  items: { type: [orderItemSchema], validate: [(items) => items.length > 0, 'Order requires at least one item'] },
  shippingAddress: { type: addressSchema, required: true }, billingAddress: { type: addressSchema, required: true },
  subtotal: { type: Number, required: true, min: 0 }, shippingFee: { type: Number, min: 0, default: 0 }, discount: { type: Number, min: 0, default: 0 }, total: { type: Number, required: true, min: 0 },
  coupon: { code: { type: String, uppercase: true, trim: true, default: '' }, discountType: { type: String, enum: ['percentage', 'fixed', null], default: null }, discountValue: { type: Number, min: 0, default: 0 } },
  shippingMethod: { type: String, enum: ['standard', 'express', 'pickup'], default: 'standard' },
  estimatedDelivery: { type: Date, default: null },
  paymentMethod: { type: String, enum: ['COD', 'Stripe'], default: 'COD', index: true },
  payment: {
    provider: { type: String, enum: ['cod', 'stripe'], default: 'cod' },
    intentId: { type: String, trim: true, default: '' }, transactionId: { type: String, trim: true, default: '' },
    currency: { type: String, uppercase: true, default: 'LKR' }, amount: { type: Number, min: 0, default: 0 }, paidAt: { type: Date, default: null }, failureReason: { type: String, trim: true, maxlength: 500, default: '' },
  },
  paymentStatus: { type: String, enum: PAYMENT_STATUSES, default: 'Pending', index: true },
  orderStatus: { type: String, enum: ORDER_STATUSES, default: 'Pending', index: true },
  timeline: { type: [timelineSchema], default: [] }, refunds: { type: [refundSchema], default: [] },
  trackingNumber: { type: String, trim: true, maxlength: 120, default: '' }, notes: { type: String, trim: true, maxlength: 1000, default: '' },
}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } })

orderSchema.index({ createdAt: -1, orderStatus: 1 })
orderSchema.index({ 'payment.intentId': 1 }, { unique: true, partialFilterExpression: { 'payment.intentId': { $type: 'string', $gt: '' } } })
const Order = mongoose.model('Order', orderSchema)
export default Order
