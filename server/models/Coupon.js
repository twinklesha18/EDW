import mongoose from 'mongoose'

const couponSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true, uppercase: true, trim: true, maxlength: 40 },
  discountType: { type: String, enum: ['percentage', 'fixed'], required: true },
  discountValue: { type: Number, required: true, min: 0.01 },
  minimumAmount: { type: Number, min: 0, default: 0 }, maximumDiscount: { type: Number, min: 0, default: null },
  expiryDate: { type: Date, required: true }, usageLimit: { type: Number, min: 1, default: 1 }, usedCount: { type: Number, min: 0, default: 0 },
  isActive: { type: Boolean, default: true, index: true },
  redemptions: { type: [{ user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true }, usedAt: { type: Date, default: Date.now } }], default: [] },
}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } })

const Coupon = mongoose.model('Coupon', couponSchema)
export default Coupon
