import mongoose from 'mongoose'

const customizationSchema = new mongoose.Schema(
  {
    message: { type: String, trim: true, maxlength: 250, default: '' },
    preferredColor: { type: String, trim: true, maxlength: 100, default: '' },
    notes: { type: String, trim: true, maxlength: 500, default: '' },
  },
  { _id: false },
)

const cartItemSchema = new mongoose.Schema(
  {
    productId: { type: String, required: true, trim: true, maxlength: 100 },
    signature: { type: String, required: true },
    name: { type: String, required: true, trim: true, maxlength: 160 },
    slug: { type: String, required: true, trim: true, maxlength: 180 },
    image: { type: String, required: true, trim: true, maxlength: 500 },
    size: { type: String, required: true, enum: ['S', 'M', 'L'] },
    price: { type: Number, required: true, min: 0.01 },
    quantity: { type: Number, required: true, min: 1 },
    category: { type: String, required: true, trim: true, maxlength: 120 },
    customization: { type: customizationSchema, default: () => ({}) },
  },
  { timestamps: true },
)

const cartSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
    items: { type: [cartItemSchema], default: [] },
    subtotal: { type: Number, min: 0, default: 0 },
  },
  { timestamps: true },
)

const Cart = mongoose.model('Cart', cartSchema)
export default Cart
