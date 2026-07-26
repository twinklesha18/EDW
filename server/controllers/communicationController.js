import ContactMessage from '../models/ContactMessage.js'
import NewsletterSubscriber from '../models/NewsletterSubscriber.js'
import { notifyAdmins, notifySafely } from '../services/notificationService.js'
import { escapeRegex, paginationData, paginationFromQuery } from '../utils/queryUtils.js'
import { AppError, sendSuccess } from '../utils/responseUtils.js'

export async function submitContactMessage(request, response) {
  const recentSubmissionCount = await ContactMessage.countDocuments({
    createdAt: { $gte: new Date(Date.now() - 60 * 60 * 1000) },
    $or: [
      { email: request.validatedBody.email },
      { phone: request.validatedBody.phone },
    ],
  })
  if (recentSubmissionCount >= 5) {
    throw new AppError('Too many messages were submitted. Please try again later.', 429)
  }

  const contactMessage = await ContactMessage.create(request.validatedBody)

  await notifySafely(() => notifyAdmins({
    type: 'new_contact_message',
    title: 'New customer message',
    message: `${contactMessage.fullName} sent “${contactMessage.subject}”.`,
    link: '/admin/communications',
  }))

  return sendSuccess(response, {
    statusCode: 201,
    message: 'Your message has been sent successfully',
    data: { messageId: contactMessage.id },
  })
}

export async function subscribeToNewsletter(request, response) {
  const { email } = request.validatedBody
  const existing = await NewsletterSubscriber.findOne({ email })

  if (existing?.isActive) {
    return sendSuccess(response, {
      message: 'This email address is already subscribed',
      data: { subscribed: true },
    })
  }

  let subscriber = existing
  if (subscriber) {
    subscriber.isActive = true
    subscriber.subscribedAt = new Date()
    subscriber.unsubscribedAt = null
    await subscriber.save()
  } else {
    try {
      subscriber = await NewsletterSubscriber.create({ email })
    } catch (error) {
      if (error.code !== 11000) throw error
      return sendSuccess(response, {
        message: 'This email address is already subscribed',
        data: { subscribed: true },
      })
    }
  }

  await notifySafely(() => notifyAdmins({
    type: 'newsletter_subscription',
    title: 'New newsletter subscriber',
    message: `${email} joined the Eshaz Dream World mailing list.`,
    link: '/admin/communications',
  }))

  return sendSuccess(response, {
    statusCode: 201,
    message: 'Thank you for joining Eshaz Dream World',
    data: { subscribed: true },
  })
}

export async function adminListContactMessages(request, response) {
  const { page, limit, skip } = paginationFromQuery(request.query, { defaultLimit: 10, maxLimit: 50 })
  const filter = {}
  const search = String(request.query.search || '').trim()
  if (['Unread', 'Read'].includes(request.query.status)) filter.status = request.query.status
  if (search) {
    const pattern = new RegExp(escapeRegex(search), 'i')
    filter.$or = [
      { fullName: pattern },
      { email: pattern },
      { phone: pattern },
      { subject: pattern },
      { message: pattern },
    ]
  }

  const [messages, total] = await Promise.all([
    ContactMessage.find(filter)
      .populate('readBy', 'firstName lastName')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    ContactMessage.countDocuments(filter),
  ])

  return sendSuccess(response, {
    message: 'Contact messages retrieved',
    data: { messages, pagination: paginationData(total, page, limit) },
  })
}

export async function adminListNewsletterSubscribers(request, response) {
  const { page, limit, skip } = paginationFromQuery(request.query, { defaultLimit: 10, maxLimit: 50 })
  const filter = {}
  const search = String(request.query.search || '').trim()
  if (request.query.status === 'active') filter.isActive = true
  if (request.query.status === 'inactive') filter.isActive = false
  if (search) filter.email = new RegExp(escapeRegex(search), 'i')

  const [subscribers, total] = await Promise.all([
    NewsletterSubscriber.find(filter).sort({ subscribedAt: -1 }).skip(skip).limit(limit),
    NewsletterSubscriber.countDocuments(filter),
  ])

  return sendSuccess(response, {
    message: 'Newsletter subscribers retrieved',
    data: { subscribers, pagination: paginationData(total, page, limit) },
  })
}

export async function markContactMessageRead(request, response) {
  const contactMessage = await ContactMessage.findById(request.params.id)
  if (!contactMessage) throw new AppError('Contact message not found', 404)

  if (contactMessage.status !== 'Read') {
    contactMessage.status = 'Read'
    contactMessage.readAt = new Date()
    contactMessage.readBy = request.user._id
    await contactMessage.save()
  }

  await contactMessage.populate('readBy', 'firstName lastName')
  return sendSuccess(response, {
    message: 'Contact message marked as read',
    data: { contactMessage },
  })
}
