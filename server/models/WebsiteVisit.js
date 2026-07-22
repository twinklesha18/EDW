import mongoose from 'mongoose'

const websiteVisitSchema = new mongoose.Schema({
  visitorHash: { type: String, required: true, index: true, select: false },
  sessionHash: { type: String, required: true, unique: true, index: true, select: false },
  entryPath: { type: String, required: true, maxlength: 250 },
  lastPath: { type: String, required: true, maxlength: 250 },
  deviceType: { type: String, enum: ['mobile', 'tablet', 'desktop'], required: true },
  pageViews: { type: Number, min: 0, default: 0 },
  firstSeenAt: { type: Date, required: true },
  lastSeenAt: { type: Date, required: true, index: true },
}, { timestamps: true, versionKey: false })

websiteVisitSchema.index({ createdAt: -1 })
websiteVisitSchema.index({ visitorHash: 1, createdAt: -1 })

export default mongoose.model('WebsiteVisit', websiteVisitSchema)
