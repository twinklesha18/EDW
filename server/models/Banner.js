import mongoose from 'mongoose'

const bannerSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, maxlength: 160 },
  image: { url: { type: String, required: true, trim: true, maxlength: 800 }, publicId: { type: String, trim: true, maxlength: 300, default: '' } },
  position: { type: String, enum: ['hero', 'promotional', 'gallery'], default: 'hero' },
  isActive: { type: Boolean, default: true, index: true },
}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } })

const Banner = mongoose.model('Banner', bannerSchema)
export default Banner
