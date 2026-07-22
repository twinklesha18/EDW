import Product from '../models/Product.js'
import Review from '../models/Review.js'
import Order from '../models/Order.js'
import { paginationData, paginationFromQuery } from '../utils/queryUtils.js'
import { recalculateProductRating } from '../utils/reviewUtils.js'
import { AppError, sendSuccess } from '../utils/responseUtils.js'

export async function createReview(request, response) {
  const { product: productId, orderNumber, ...reviewValues } = request.validatedBody
  const order = await Order.findOne({ orderNumber, user: request.user._id })
  if (!order) throw new AppError('Order not found', 404)
  if (order.orderStatus !== 'Delivered') throw new AppError('You can review products only after the order is delivered', 409)
  if (!order.items.some((item) => String(item.product) === String(productId))) throw new AppError('This product is not part of the delivered order', 403)
  const product = await Product.findById(productId)
  if (!product) throw new AppError('Product not found', 404)
  if (await Review.exists({ product: productId, user: request.user._id })) throw new AppError('You have already reviewed this product', 409)
  const review = await Review.create({ ...reviewValues, product: productId, order: order._id, user: request.user._id, isApproved: false, isVisible: true })
  await review.populate([{ path: 'user', select: 'firstName lastName avatar' }, { path: 'product', select: 'name slug image' }])
  return sendSuccess(response, { statusCode: 201, message: 'Review submitted for administrator approval', data: { review } })
}
export async function updateOwnReview(request, response) { const review = await Review.findOne({ _id: request.params.id, user: request.user._id }); if (!review) throw new AppError('Review not found', 404); review.rating = request.validatedBody.rating; review.title = request.validatedBody.title; review.comment = request.validatedBody.comment; review.isApproved = false; await review.save(); await recalculateProductRating(review.product); return sendSuccess(response, { message: 'Review updated and submitted for approval', data: { review } }) }
export async function deleteOwnReview(request, response) { const review = await Review.findOne({ _id: request.params.id, user: request.user._id }); if (!review) throw new AppError('Review not found', 404); const productId = review.product; await review.deleteOne(); await recalculateProductRating(productId); return sendSuccess(response, { message: 'Review deleted successfully' }) }
export async function adminListReviews(request, response) { const { page, limit, skip } = paginationFromQuery(request.query, { defaultLimit: 10 }); const filter = {}; if (request.query.status === 'approved') filter.isApproved = true; if (request.query.status === 'pending') filter.isApproved = false; if (request.query.status === 'hidden') filter.isVisible = false; const [reviews, total] = await Promise.all([Review.find(filter).populate('user', 'firstName lastName email').populate('product', 'name slug image').sort({ createdAt: -1 }).skip(skip).limit(limit), Review.countDocuments(filter)]); return sendSuccess(response, { message: 'Reviews retrieved', data: { reviews, pagination: paginationData(total, page, limit) } }) }
export async function moderateReview(request, response) { const review = await Review.findById(request.params.id); if (!review) throw new AppError('Review not found', 404); Object.assign(review, request.validatedBody); await review.save(); await recalculateProductRating(review.product); return sendSuccess(response, { message: 'Review moderation updated', data: { review } }) }
export async function adminDeleteReview(request, response) { const review = await Review.findById(request.params.id); if (!review) throw new AppError('Review not found', 404); const productId = review.product; await review.deleteOne(); await recalculateProductRating(productId); return sendSuccess(response, { message: 'Review deleted successfully' }) }

export async function listHomepageReviews(_request, response) {
  const reviews = await Review.find({ isApproved: true, isVisible: true })
    .populate('user', 'firstName lastName avatar')
    .populate('product', 'name slug image')
    .sort({ createdAt: -1 })
    .limit(6)
  return sendSuccess(response, { message: 'Approved customer reviews retrieved', data: { reviews } })
}
