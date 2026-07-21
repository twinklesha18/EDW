import crypto from 'node:crypto'

export const normalizeCustomization = (customization = {}) => ({
  message: customization.message || '',
  preferredColor: customization.preferredColor || '',
  notes: customization.notes || '',
})

export function createCartSignature(productId, size, customization = {}) {
  const normalized = normalizeCustomization(customization)
  return crypto
    .createHash('sha256')
    .update(JSON.stringify({ productId, size, ...normalized }))
    .digest('hex')
}

export function recalculateCart(cart) {
  cart.subtotal = cart.items.reduce((total, item) => total + item.price * item.quantity, 0)
  return cart
}
