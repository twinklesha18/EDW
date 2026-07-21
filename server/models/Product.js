import mongoose from 'mongoose'

const imageSchema = new mongoose.Schema({
  url: { type: String, required: true, trim: true, maxlength: 800 },
  publicId: { type: String, trim: true, maxlength: 300, default: '' },
  alt: { type: String, trim: true, maxlength: 160, default: '' },
}, { _id: false })

const pricesSchema = new mongoose.Schema({
  S: { type: Number, required: true, min: 0.01 },
  M: { type: Number, required: true, min: 0.01 },
  L: { type: Number, required: true, min: 0.01 },
}, { _id: false })

const productSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, minlength: 2, maxlength: 160 },
  slug: { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: 180 },
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true, index: true },
  description: { type: String, required: true, trim: true, minlength: 10, maxlength: 5000 },
  prices: { type: pricesSchema, required: true },
  image: { type: imageSchema, required: true },
}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } })

productSchema.index({ name: 'text', description: 'text' })

const Product = mongoose.model('Product', productSchema)
export default Product
