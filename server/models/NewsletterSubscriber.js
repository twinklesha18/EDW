import mongoose from 'mongoose'

const newsletterSubscriberSchema = new mongoose.Schema({
  email: { type: String, required: true, trim: true, lowercase: true, maxlength: 160, unique: true, index: true },
  isActive: { type: Boolean, default: true, index: true },
  subscribedAt: { type: Date, default: Date.now },
  unsubscribedAt: { type: Date, default: null },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
})

newsletterSubscriberSchema.index({ subscribedAt: -1 })

export default mongoose.model('NewsletterSubscriber', newsletterSubscriberSchema)
