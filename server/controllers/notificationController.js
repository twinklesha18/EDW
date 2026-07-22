import Notification from '../models/Notification.js'
import { paginationData, paginationFromQuery } from '../utils/queryUtils.js'
import { AppError, sendSuccess } from '../utils/responseUtils.js'

export async function listNotifications(request, response) {
  const { page, limit, skip } = paginationFromQuery(request.query, { defaultLimit: 12, maxLimit: 30 })
  const filter = { recipient: request.user._id }
  if (request.query.unread === 'true') filter.readAt = null
  const [notifications, total, unreadCount] = await Promise.all([
    Notification.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Notification.countDocuments(filter),
    Notification.countDocuments({ recipient: request.user._id, readAt: null }),
  ])
  return sendSuccess(response, { message: 'Notifications retrieved', data: { notifications, unreadCount, pagination: paginationData(total, page, limit) } })
}

export async function markNotificationRead(request, response) {
  const notification = await Notification.findOneAndUpdate(
    { _id: request.params.id, recipient: request.user._id },
    { $set: { readAt: new Date() } },
    { returnDocument: 'after' },
  )
  if (!notification) throw new AppError('Notification not found', 404)
  return sendSuccess(response, { message: 'Notification marked as read', data: { notification } })
}

export async function markAllNotificationsRead(request, response) {
  const result = await Notification.updateMany({ recipient: request.user._id, readAt: null }, { $set: { readAt: new Date() } })
  return sendSuccess(response, { message: 'All notifications marked as read', data: { updated: result.modifiedCount } })
}
