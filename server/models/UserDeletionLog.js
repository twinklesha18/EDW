import mongoose from 'mongoose'

const counterSchema = new mongoose.Schema({
  addresses: { type: Number, min: 0, default: 0 },
  normalOrders: { type: Number, min: 0, default: 0 },
  customOrders: { type: Number, min: 0, default: 0 },
  reviews: { type: Number, min: 0, default: 0 },
  cartItems: { type: Number, min: 0, default: 0 },
  wishlistItems: { type: Number, min: 0, default: 0 },
  notifications: { type: Number, min: 0, default: 0 },
  uploadedFiles: { type: Number, min: 0, default: 0 },
  uploadedFilesRemoved: { type: Number, min: 0, default: 0 },
}, { _id: false })

const identitySchema = new mongoose.Schema({
  originalId: { type: String, required: true },
  name: { type: String, trim: true, maxlength: 140, required: true },
  email: { type: String, trim: true, lowercase: true, maxlength: 160, required: true },
  role: { type: String, enum: ['user', 'admin'], required: true },
}, { _id: false })

const userDeletionLogSchema = new mongoose.Schema({
  action: { type: String, enum: ['user_cascade_deleted'], default: 'user_cascade_deleted', immutable: true },
  status: { type: String, enum: ['In Progress', 'Completed', 'Failed'], default: 'In Progress', index: true },
  deletedUser: { type: identitySchema, required: true },
  performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  performedBySnapshot: { type: identitySchema, required: true },
  counts: { type: counterSchema, default: () => ({}) },
  orderNumbers: { type: [String], default: [] },
  customOrderNumbers: { type: [String], default: [] },
  referencesTruncated: { type: Boolean, default: false },
  failureMessage: { type: String, trim: true, maxlength: 500, default: '' },
  completedAt: { type: Date, default: null },
}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } })

userDeletionLogSchema.index({ createdAt: -1 })
userDeletionLogSchema.index({ 'deletedUser.email': 1, createdAt: -1 })

export default mongoose.model('UserDeletionLog', userDeletionLogSchema)
