import Cart from '../models/Cart.js'
import CustomOrder from '../models/CustomOrder.js'
import Notification from '../models/Notification.js'
import Order from '../models/Order.js'
import Review from '../models/Review.js'
import SiteSetting from '../models/SiteSetting.js'
import User from '../models/User.js'
import UserDeletionLog from '../models/UserDeletionLog.js'
import Wishlist from '../models/Wishlist.js'
import { deleteImage } from '../utils/cloudinaryUtils.js'

const identitySnapshot = (user) => ({
  originalId: String(user._id),
  name: `${user.firstName} ${user.lastName}`.trim(),
  email: user.email,
  role: user.role,
})

export async function cascadeDeleteUser({ user, performedBy }) {
  const [orders, customOrders, reviews, cart, wishlist] = await Promise.all([
    Order.find({ user: user._id }).select('_id orderNumber payment.slip.publicId'),
    CustomOrder.find({ user: user._id }).select('_id requestNumber inspiration.publicId paymentSlip.publicId'),
    Review.find({ user: user._id }).select('_id product'),
    Cart.findOne({ user: user._id }).select('items'),
    Wishlist.findOne({ user: user._id }).select('items'),
  ])
  const orderIds = orders.map((order) => order._id)
  const customOrderIds = customOrders.map((order) => order._id)
  const notificationFilter = {
    $or: [
      { recipient: user._id },
      { order: { $in: orderIds } },
      { customOrder: { $in: customOrderIds } },
    ],
  }
  const notificationCount = await Notification.countDocuments(notificationFilter)
  const publicIds = [
    ...orders.map((order) => order.payment?.slip?.publicId),
    ...customOrders.flatMap((order) => [order.inspiration?.publicId, order.paymentSlip?.publicId]),
  ].filter(Boolean)
  const referenceLimit = 100
  const log = await UserDeletionLog.create({
    deletedUser: identitySnapshot(user),
    performedBy: performedBy._id,
    performedBySnapshot: identitySnapshot(performedBy),
    counts: {
      addresses: user.addresses?.length || 0,
      normalOrders: orders.length,
      customOrders: customOrders.length,
      reviews: reviews.length,
      cartItems: cart?.items?.length || 0,
      wishlistItems: wishlist?.items?.length || 0,
      notifications: notificationCount,
      uploadedFiles: publicIds.length,
    },
    orderNumbers: orders.slice(0, referenceLimit).map((order) => order.orderNumber),
    customOrderNumbers: customOrders.slice(0, referenceLimit).map((order) => order.requestNumber),
    referencesTruncated: orders.length > referenceLimit || customOrders.length > referenceLimit,
  })

  try {
    await Promise.all([
      Notification.deleteMany(notificationFilter),
      Review.deleteMany({ user: user._id }),
      Cart.deleteMany({ user: user._id }),
      Wishlist.deleteMany({ user: user._id }),
      Order.deleteMany({ user: user._id }),
      CustomOrder.deleteMany({ user: user._id }),
      Order.updateMany({ 'timeline.updatedBy': user._id }, { $set: { 'timeline.$[entry].updatedBy': null } }, { arrayFilters: [{ 'entry.updatedBy': user._id }] }),
      Order.updateMany({ 'cancellation.cancelledBy': user._id }, { $set: { 'cancellation.cancelledBy': null } }),
      CustomOrder.updateMany({ 'statusHistory.updatedBy': user._id }, { $set: { 'statusHistory.$[entry].updatedBy': null } }, { arrayFilters: [{ 'entry.updatedBy': user._id }] }),
      CustomOrder.updateMany({ 'paymentHistory.updatedBy': user._id }, { $set: { 'paymentHistory.$[entry].updatedBy': null } }, { arrayFilters: [{ 'entry.updatedBy': user._id }] }),
      SiteSetting.updateMany({ updatedBy: user._id }, { $set: { updatedBy: null } }),
    ])
    await User.deleteOne({ _id: user._id })

    const cleanupResults = await Promise.all(publicIds.map((publicId) => deleteImage(publicId).then(() => true).catch(() => false)))
    const uploadedFilesRemoved = cleanupResults.filter(Boolean).length
    log.counts.uploadedFilesRemoved = uploadedFilesRemoved
    log.status = 'Completed'
    log.completedAt = new Date()
    if (uploadedFilesRemoved !== publicIds.length) {
      log.failureMessage = `${publicIds.length - uploadedFilesRemoved} uploaded file(s) could not be removed from storage and require manual cleanup.`
    }
    await log.save()
  } catch (error) {
    log.status = 'Failed'
    log.failureMessage = String(error.message || 'Cascade deletion failed').slice(0, 500)
    log.completedAt = new Date()
    await log.save().catch(() => {})
    throw error
  }

  return { deletionLogId: log.id, counts: log.counts }
}
