import mongoose from 'mongoose'

const contactMessageSchema = new mongoose.Schema({
  fullName: { type: String, required: true, trim: true, minlength: 2, maxlength: 120 },
  email: { type: String, required: true, trim: true, lowercase: true, maxlength: 160, index: true },
  phone: { type: String, required: true, trim: true, maxlength: 10 },
  subject: { type: String, required: true, trim: true, minlength: 3, maxlength: 120 },
  message: { type: String, required: true, trim: true, minlength: 20, maxlength: 2000 },
  status: { type: String, enum: ['Unread', 'Read'], default: 'Unread', index: true },
  readAt: { type: Date, default: null },
  readBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
})

contactMessageSchema.index({ createdAt: -1 })

export default mongoose.model('ContactMessage', contactMessageSchema)
