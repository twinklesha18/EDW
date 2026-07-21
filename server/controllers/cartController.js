import Cart from '../models/Cart.js'
import Product from '../models/Product.js'
import { createCartSignature, recalculateCart } from '../utils/cartUtils.js'
import { AppError, sendSuccess } from '../utils/responseUtils.js'

const cartData = (cart) => ({
  id: cart._id,
  items: cart.items,
  subtotal: cart.subtotal,
  itemCount: cart.items.reduce((total, item) => total + item.quantity, 0),
})

const getOrCreateCart = (userId) => Cart.findOneAndUpdate(
  { user: userId },
  { $setOnInsert: { user: userId, items: [], subtotal: 0 } },
  { returnDocument: 'after', upsert: true, setDefaultsOnInsert: true },
)

const trustedCartItem = async (snapshot) => {
  const product = await Product.findById(snapshot.productId).populate('category', 'name')
  if (!product) throw new AppError('Product is no longer available', 409)
  const price = Number(product.prices?.[snapshot.size])
  if (!Number.isFinite(price) || price <= 0) throw new AppError(`${snapshot.size} size is unavailable`, 409)
  return {
    productId: String(product._id), name: product.name, slug: product.slug, image: product.image.url,
    size: snapshot.size, price, quantity: snapshot.quantity, category: product.category?.name || 'Uncategorized',
    customization: snapshot.customization,
  }
}

export async function getCart(request, response) {
  const cart = await getOrCreateCart(request.user._id)
  return sendSuccess(response, { message: 'Cart retrieved', data: { cart: cartData(cart) } })
}

export async function addCartItem(request, response) {
  const cart = await getOrCreateCart(request.user._id)
  const item = await trustedCartItem(request.validatedBody)
  const signature = createCartSignature(item.productId, item.size, item.customization)
  const existing = cart.items.find((entry) => entry.signature === signature)
  if (existing) existing.quantity = Math.min(99, existing.quantity + item.quantity)
  else cart.items.push({ ...item, signature })
  recalculateCart(cart)
  await cart.save()
  return sendSuccess(response, { statusCode: 201, message: 'Added to your cart', data: { cart: cartData(cart) } })
}

export async function updateCartItem(request, response) {
  const cart = await getOrCreateCart(request.user._id)
  const item = cart.items.id(request.params.itemId)
  if (!item) throw new AppError('Cart item not found', 404)
  const { quantity } = request.validatedBody
  if (quantity === 0) item.deleteOne()
  else item.quantity = quantity
  recalculateCart(cart)
  await cart.save()
  return sendSuccess(response, { message: quantity === 0 ? 'Item removed successfully' : 'Cart quantity updated', data: { cart: cartData(cart) } })
}

export async function removeCartItem(request, response) {
  const cart = await getOrCreateCart(request.user._id)
  const item = cart.items.id(request.params.itemId)
  if (!item) throw new AppError('Cart item not found', 404)
  item.deleteOne()
  recalculateCart(cart)
  await cart.save()
  return sendSuccess(response, { message: 'Item removed successfully', data: { cart: cartData(cart) } })
}

export async function clearCart(request, response) {
  const cart = await getOrCreateCart(request.user._id)
  cart.items = []
  cart.subtotal = 0
  await cart.save()
  return sendSuccess(response, { message: 'Cart cleared', data: { cart: cartData(cart) } })
}

export async function syncCart(request, response) {
  const cart = await getOrCreateCart(request.user._id)
  for (const snapshot of request.validatedBody.items) {
    let item
    try { item = await trustedCartItem(snapshot) } catch (error) { if (error.statusCode === 409) continue; throw error }
    const signature = createCartSignature(item.productId, item.size, item.customization)
    const existing = cart.items.find((entry) => entry.signature === signature)
    if (existing) existing.quantity = Math.min(99, existing.quantity + item.quantity)
    else cart.items.push({ ...item, signature })
  }
  recalculateCart(cart)
  await cart.save()
  return sendSuccess(response, { message: 'Guest cart merged successfully', data: { cart: cartData(cart) } })
}
