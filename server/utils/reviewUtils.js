import Review from '../models/Review.js'

export async function recalculateProductRating(productId) {
  const [summary] = await Review.aggregate([
    { $match: { product: productId, isApproved: true, isVisible: true } },
    { $group: { _id: '$product', rating: { $avg: '$rating' }, reviewCount: { $sum: 1 } } },
  ])
  return summary ? { rating: Number(summary.rating.toFixed(2)), reviewCount: summary.reviewCount } : { rating: 0, reviewCount: 0 }
}
