import mongoose from 'mongoose'

const bannerSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, maxlength: 160 }, subtitle: { type: String, trim: true, maxlength: 300, default: '' },
  image: { url: { type: String, required: true, trim: true, maxlength: 800 }, publicId: { type: String, trim: true, maxlength: 300, default: '' } },
  link: { type: String, trim: true, maxlength: 500, default: '' }, buttonText: { type: String, trim: true, maxlength: 60, default: '' },
  position: { type: String, enum: ['hero', 'promotional', 'collection'], default: 'hero' },
  isActive: { type: Boolean, default: true, index: true }, sortOrder: { type: Number, min: 0, default: 0 },
  startsAt: { type: Date, default: null }, endsAt: { type: Date, default: null },
}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } })

const Banner = mongoose.model('Banner', bannerSchema)
export default Banner
