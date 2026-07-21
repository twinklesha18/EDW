import mongoose from 'mongoose'

const addressSchema = new mongoose.Schema({
  fullName: String, phone: String, addressLine1: String, addressLine2: String,
  city: String, district: String, province: String, postalCode: String, country: String,
}, { _id: false })

const itemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  name: String, slug: String, size: { type: String, enum: ['S', 'M', 'L'] }, image: String, price: Number, quantity: Number,
  customization: { message: String, preferredColor: String, notes: String },
}, { _id: false })

const checkoutSessionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  paymentIntentId: { type: String, unique: true, sparse: true, index: true },
  items: { type: [itemSchema], required: true },
  shippingAddress: { type: addressSchema, required: true },
  billingAddress: { type: addressSchema, required: true },
  shippingMethod: { type: String, enum: ['standard', 'express', 'pickup'], required: true },
  couponCode: { type: String, uppercase: true, trim: true, default: '' },
  coupon: { id: { type: mongoose.Schema.Types.ObjectId, ref: 'Coupon', default: null }, code: { type: String, default: '' }, discountType: { type: String, enum: ['percentage', 'fixed', null], default: null }, discountValue: { type: Number, min: 0, default: 0 } },
  subtotal: { type: Number, required: true, min: 0 },
  shippingFee: { type: Number, required: true, min: 0 },
  discount: { type: Number, required: true, min: 0 },
  total: { type: Number, required: true, min: 0 },
  estimatedDelivery: { type: Date, required: true },
  status: { type: String, enum: ['Pending', 'Completed', 'Failed'], default: 'Pending', index: true },
  failureReason: { type: String, trim: true, maxlength: 500, default: '' },
  expiresAt: { type: Date, required: true, index: { expires: 0 } },
}, { timestamps: true })

const CheckoutSession = mongoose.model('CheckoutSession', checkoutSessionSchema)
export default CheckoutSession
