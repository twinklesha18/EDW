import mongoose from 'mongoose'

const notificationSchema = new mongoose.Schema({
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  audience: { type: String, enum: ['customer', 'admin'], required: true },
  type: { type: String, trim: true, maxlength: 60, required: true },
  title: { type: String, trim: true, maxlength: 160, required: true },
  message: { type: String, trim: true, maxlength: 600, required: true },
  link: { type: String, trim: true, maxlength: 500, default: '' },
  order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', default: null },
  customOrder: { type: mongoose.Schema.Types.ObjectId, ref: 'CustomOrder', default: null },
  readAt: { type: Date, default: null },
}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } })

notificationSchema.index({ recipient: 1, readAt: 1, createdAt: -1 })
notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 180 * 24 * 60 * 60 })

export default mongoose.model('Notification', notificationSchema)
