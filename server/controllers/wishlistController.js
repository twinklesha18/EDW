import Wishlist from '../models/Wishlist.js'
import { AppError, sendSuccess } from '../utils/responseUtils.js'
import Product from '../models/Product.js'

const wishlistData = (wishlist) => ({ id: wishlist._id, items: wishlist.items, count: wishlist.items.length })
const getOrCreateWishlist = (userId) => Wishlist.findOneAndUpdate(
  { user: userId },
  { $setOnInsert: { user: userId, items: [] } },
  { returnDocument: 'after', upsert: true, setDefaultsOnInsert: true },
)

const trustedWishlistItem = async (snapshot) => {
  const product = await Product.findById(snapshot.productId).populate('category', 'name')
  if (!product) throw new AppError('Product is no longer available', 409)
  return { productId: String(product._id), name: product.name, slug: product.slug, image: product.image.url, price: product.prices.S, category: product.category?.name || 'Uncategorized' }
}

export async function getWishlist(request, response) {
  const wishlist = await getOrCreateWishlist(request.user._id)
  return sendSuccess(response, { message: 'Wishlist retrieved', data: { wishlist: wishlistData(wishlist) } })
}

export async function addWishlistItem(request, response) {
  const wishlist = await getOrCreateWishlist(request.user._id)
  const trustedItem = await trustedWishlistItem(request.validatedBody)
  const exists = wishlist.items.some((item) => item.productId === trustedItem.productId)
  if (!exists) {
    wishlist.items.push(trustedItem)
    await wishlist.save()
  }
  return sendSuccess(response, { statusCode: exists ? 200 : 201, message: exists ? 'Item is already in your wishlist' : 'Added to your wishlist', data: { wishlist: wishlistData(wishlist) } })
}

export async function removeWishlistItem(request, response) {
  const wishlist = await getOrCreateWishlist(request.user._id)
  wishlist.items = wishlist.items.filter((item) => item.productId !== request.params.productId)
  await wishlist.save()
  return sendSuccess(response, { message: 'Item removed successfully', data: { wishlist: wishlistData(wishlist) } })
}

export async function clearWishlist(request, response) {
  const wishlist = await getOrCreateWishlist(request.user._id)
  wishlist.items = []
  await wishlist.save()
  return sendSuccess(response, { message: 'Wishlist cleared', data: { wishlist: wishlistData(wishlist) } })
}

export async function syncWishlist(request, response) {
  const wishlist = await getOrCreateWishlist(request.user._id)
  for (const snapshot of request.validatedBody.items) {
    let item
    try { item = await trustedWishlistItem(snapshot) } catch (error) { if (error.statusCode === 409) continue; throw error }
    if (!wishlist.items.some((entry) => entry.productId === item.productId)) wishlist.items.push(item)
  }
  await wishlist.save()
  return sendSuccess(response, { message: 'Guest wishlist merged successfully', data: { wishlist: wishlistData(wishlist) } })
}
