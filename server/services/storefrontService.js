import Banner from '../models/Banner.js'
import Category from '../models/Category.js'
import Product from '../models/Product.js'
import Review from '../models/Review.js'
import { getResolvedSiteSettings, publicSiteSettings } from './siteSettingsService.js'

const publicProductCategory = [{ path: 'category', select: 'name slug' }]

export async function getStorefrontBootstrapData() {
  const [settings, products, productCount, categories, categoryCounts, banners, reviews] = await Promise.all([
    getResolvedSiteSettings(),
    Product.find().populate(publicProductCategory).sort({ createdAt: -1 }).limit(100).lean(),
    Product.countDocuments(),
    Category.find({ isActive: true }).populate('parentCategory', 'name slug').sort({ sortOrder: 1, name: 1 }).lean(),
    Product.aggregate([{ $group: { _id: '$category', count: { $sum: 1 } } }]),
    Banner.find({ isActive: true, position: { $in: ['hero', 'promotional', 'gallery'] } }).sort({ createdAt: -1 }).lean(),
    Review.find({ isApproved: true, isVisible: true })
      .populate('user', 'firstName lastName avatar')
      .populate('product', 'name slug image')
      .sort({ createdAt: -1 })
      .limit(6)
      .lean(),
  ])

  const countMap = new Map(categoryCounts.map((entry) => [String(entry._id), entry.count]))
  return {
    settings: publicSiteSettings(settings),
    products: products.map((product) => ({
      ...product,
      images: Array.isArray(product.images) && product.images.length ? product.images.slice(0, 3) : [product.image].filter((image) => image?.url),
    })),
    categories: categories.map((category) => ({
      ...category,
      id: String(category._id),
      productCount: countMap.get(String(category._id)) || 0,
    })),
    banners,
    reviews,
    pagination: {
      page: 1,
      limit: 100,
      total: productCount,
      pages: Math.max(1, Math.ceil(productCount / 100)),
    },
  }
}
