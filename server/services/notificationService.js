import { env } from '../config/env.js'
import Notification from '../models/Notification.js'
import User from '../models/User.js'
import { notificationEmail } from './emailTemplates.js'
import { sendEmailSafely } from './emailService.js'

const absoluteLink = (link) => link ? `${env.clientOrigins[0]}${link.startsWith('/') ? link : `/${link}`}` : env.clientOrigins[0]

export async function notifyUser({ user, type, title, message, link = '', order = null, customOrder = null, email = true }) {
  const userId = user?._id || user
  const needsFullAccount = !user?._id || typeof user.isActive !== 'boolean' || !user.role || !user.email
  const recipient = needsFullAccount ? await User.findById(userId).select('firstName lastName email role isActive') : user
  if (!recipient || !recipient.isActive) return null
  const notification = await Notification.create({
    recipient: recipient._id,
    audience: recipient.role === 'admin' ? 'admin' : 'customer',
    type, title, message, link,
    order: order?._id || order || null,
    customOrder: customOrder?._id || customOrder || null,
  })
  if (email && recipient.email) void sendEmailSafely({
    to: recipient.email,
    ...notificationEmail(recipient, title, message, absoluteLink(link)),
  })
  return notification
}

export async function notifyAdmins({ type, title, message, link = '', order = null, customOrder = null, email = true }) {
  const admins = await User.find({ role: 'admin', isActive: true }).select('firstName email role isActive')
  await Promise.all(admins.map((admin) => notifyUser({ user: admin, type, title, message, link, order, customOrder, email })))
  return admins.length
}

export async function notifySafely(task) {
  try { return await task() }
  catch (error) {
    console.error(`Notification delivery failed: ${error.message}`)
    return null
  }
}
