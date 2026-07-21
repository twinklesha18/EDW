import mongoose from 'mongoose'

const wishlistItemSchema = new mongoose.Schema(
  {
    productId: { type: String, required: true, trim: true, maxlength: 100 },
    name: { type: String, required: true, trim: true, maxlength: 160 },
    slug: { type: String, required: true, trim: true, maxlength: 180 },
    image: { type: String, required: true, trim: true, maxlength: 500 },
    price: { type: Number, required: true, min: 0.01 },
    category: { type: String, required: true, trim: true, maxlength: 120 },
  },
  { timestamps: true },
)

const wishlistSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
    items: { type: [wishlistItemSchema], default: [] },
  },
  { timestamps: true },
)

const Wishlist = mongoose.model('Wishlist', wishlistSchema)
export default Wishlist
