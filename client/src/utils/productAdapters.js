const normalizeCustomization = (customization = {}) => ({
  message: String(customization.message || '').trim().slice(0, 250),
  preferredColor: String(customization.preferredColor || '').trim().slice(0, 100),
  notes: String(customization.notes || '').trim().slice(0, 500),
})

export function createGuestSignature(productId, size, customization = {}) {
  const normalized = normalizeCustomization(customization)
  return `${productId}::${size}::${normalized.message.toLowerCase()}::${normalized.preferredColor.toLowerCase()}::${normalized.notes.toLowerCase()}`
}

export function productToCartPayload(product, size, quantity = 1, customization = {}) {
  return {
    productId: product.id,
    name: product.name,
    slug: product.slug,
    image: product.image,
    size,
    price: Number(product.prices[size]),
    quantity: Number(quantity),
    category: product.categoryLabel || product.category,
    customization: normalizeCustomization(customization),
  }
}

export function productToWishlistPayload(product) {
  return {
    productId: product.id,
    name: product.name,
    slug: product.slug,
    image: product.image,
    price: Number(product.price),
    category: product.categoryLabel || product.category,
  }
}
