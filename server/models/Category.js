import mongoose from 'mongoose'

const categorySchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, minlength: 2, maxlength: 80 },
  slug: { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: 100 },
  description: { type: String, trim: true, maxlength: 500, default: '' },
  image: { url: { type: String, trim: true, maxlength: 800, default: '' }, publicId: { type: String, trim: true, maxlength: 300, default: '' } },
  parentCategory: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', default: null },
  isActive: { type: Boolean, default: true, index: true },
  sortOrder: { type: Number, min: 0, default: 0 },
}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } })

categorySchema.index({ name: 'text', description: 'text' })
const Category = mongoose.model('Category', categorySchema)
export default Category
