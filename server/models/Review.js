import mongoose from 'mongoose'

const reviewSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', default: null, index: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  title: { type: String, trim: true, maxlength: 120, default: '' },
  comment: { type: String, required: true, trim: true, minlength: 5, maxlength: 1500 },
  isApproved: { type: Boolean, default: false, index: true },
  isVisible: { type: Boolean, default: true, index: true },
}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } })

reviewSchema.index({ product: 1, user: 1 }, { unique: true })
const Review = mongoose.model('Review', reviewSchema)
export default Review
