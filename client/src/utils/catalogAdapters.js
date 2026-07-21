export function normalizeCatalogProduct(product) {
  const category = product.category || {}
  const prices = { S: Number(product.prices?.S || 0), M: Number(product.prices?.M || 0), L: Number(product.prices?.L || 0) }
  const productImage = product.image?.url || product.image || ''
  return {
    ...product,
    id: product.id || product._id,
    image: productImage,
    images: [productImage].filter(Boolean),
    prices,
    price: prices.S,
    oldPrice: null,
    discount: 0,
    category: category.slug || category,
    categoryId: category.id || category._id,
    categoryLabel: category.name || 'Uncategorized',
    description: product.description,
    badge: new Date(product.createdAt) > new Date(Date.now() - 30 * 86400000) ? 'New' : '',
    isNew: new Date(product.createdAt) > new Date(Date.now() - 30 * 86400000),
  }
}

export const normalizeCatalogCategory = (category) => ({ ...category, id: category.id || category._id, image: category.image?.url || '', count: category.productCount || 0 })
