import { heroFallbackImage, productImages } from '../assets/images/index.js'

const productFallbacks = Object.freeze({
  'birthday-gifts': productImages.giftHamper,
  'chocolate-bouquet': productImages.chocolateBouquet,
  'earring-bouquet': productImages.earringBouquet,
  'kinder-joy-bouquet': productImages.kinderBouquet,
  'makeup-bouquet': productImages.makeupBouquet,
  'picture-bouquet': productImages.pictureBouquet,
  'snack-bouquet': productImages.snackBox,
  'teddy-bouquet': productImages.teddyBouquet,
})

export function normalizeCatalogProduct(product) {
  const category = product.category || {}
  const prices = { S: Number(product.prices?.S || 0), M: Number(product.prices?.M || 0), L: Number(product.prices?.L || 0) }
  const productImage = product.image?.url || product.image || ''
  return {
    ...product,
    id: product.id || product._id,
    image: productImage,
    fallbackImage: productFallbacks[product.slug] || heroFallbackImage,
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
