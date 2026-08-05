import User from '../models/User.js'
import { env } from '../config/env.js'
import { passwordResetEmail, welcomeEmail } from '../services/emailTemplates.js'
import { sendEmailSafely } from '../services/emailService.js'
import { cascadeDeleteUser } from '../services/userDeletionService.js'
import { createPasswordResetToken } from '../utils/passwordUtils.js'
import { escapeRegex, paginationData, paginationFromQuery } from '../utils/queryUtils.js'
import { AppError, sendSuccess } from '../utils/responseUtils.js'

const sameUser = (left, right) => String(left) === String(right)

async function protectLastAdministrator(user, changes) {
  const removesActiveAdmin = user.role === 'admin' && user.isActive && (changes.role === 'user' || changes.isActive === false)
  if (!removesActiveAdmin) return
  const otherActiveAdmins = await User.countDocuments({ _id: { $ne: user._id }, role: 'admin', isActive: true })
  if (!otherActiveAdmins) throw new AppError('The last active administrator cannot be demoted, deactivated, or deleted', 409)
}

export async function listUsers(request, response) {
  const { page, limit, skip } = paginationFromQuery(request.query, { defaultLimit: 10 })
  const filter = {}
  if (request.query.search) {
    const pattern = new RegExp(escapeRegex(request.query.search), 'i')
    filter.$or = [{ firstName: pattern }, { lastName: pattern }, { email: pattern }, { phone: pattern }]
  }
  if (request.query.role) filter.role = request.query.role
  if (request.query.status === 'active') filter.isActive = true
  if (request.query.status === 'inactive') filter.isActive = false
  const [users, total] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    User.countDocuments(filter),
  ])
  return sendSuccess(response, { message: 'Users retrieved', data: { users, pagination: paginationData(total, page, limit) } })
}

export async function getUser(request, response) {
  const user = await User.findById(request.params.id)
  if (!user) throw new AppError('User not found', 404)
  return sendSuccess(response, { message: 'User retrieved', data: { user } })
}

export async function createUser(request, response) {
  const existing = await User.findOne({ email: request.validatedBody.email }).select('_id')
  if (existing) throw new AppError('An account with this email already exists', 409, [{ field: 'email', message: 'Email is already in use' }])
  const user = await User.create(request.validatedBody)
  await sendEmailSafely({ to: user.email, ...welcomeEmail(user, env.clientUrl) })
  return sendSuccess(response, { statusCode: 201, message: 'User created successfully', data: { user } })
}

export async function updateUser(request, response) {
  const user = await User.findById(request.params.id).select('+sessionVersion')
  if (!user) throw new AppError('User not found', 404)
  const changes = request.validatedBody
  if (sameUser(user._id, request.user._id) && (changes.role !== 'admin' || changes.isActive === false)) throw new AppError('You cannot remove your own administrator access', 409)
  await protectLastAdministrator(user, changes)
  const accessChanged = user.role !== changes.role || user.isActive !== changes.isActive
  const emailChanged = user.email !== changes.email
  Object.assign(user, changes)
  if (emailChanged) user.isEmailVerified = false
  if (accessChanged) user.sessionVersion = Number(user.sessionVersion || 0) + 1
  await user.save()
  return sendSuccess(response, { message: 'User updated successfully', data: { user } })
}

export async function updateUserAccess(request, response) {
  const user = await User.findById(request.params.id).select('+sessionVersion')
  if (!user) throw new AppError('User not found', 404)
  if (sameUser(user._id, request.user._id) && (request.validatedBody.role === 'user' || request.validatedBody.isActive === false)) throw new AppError('You cannot remove your own admin access', 409)
  await protectLastAdministrator(user, request.validatedBody)
  const changed = (request.validatedBody.role && user.role !== request.validatedBody.role) || (typeof request.validatedBody.isActive === 'boolean' && user.isActive !== request.validatedBody.isActive)
  Object.assign(user, request.validatedBody)
  if (changed) user.sessionVersion = Number(user.sessionVersion || 0) + 1
  await user.save()
  return sendSuccess(response, { message: 'User access updated successfully', data: { user } })
}

export async function changeUserPassword(request, response) {
  const user = await User.findById(request.params.id).select('+password +sessionVersion +resetPasswordToken +resetPasswordExpire')
  if (!user) throw new AppError('User not found', 404)
  user.password = request.validatedBody.password
  user.sessionVersion = Number(user.sessionVersion || 0) + 1
  user.resetPasswordToken = undefined
  user.resetPasswordExpire = undefined
  await user.save()
  return sendSuccess(response, { message: 'Password changed successfully; existing sessions were signed out' })
}

export async function deleteUser(request, response) {
  const user = await User.findById(request.params.id)
  if (!user) throw new AppError('User not found', 404)
  if (sameUser(user._id, request.user._id)) throw new AppError('You cannot delete your own administrator account', 409)
  await protectLastAdministrator(user, { isActive: false })
  const result = await cascadeDeleteUser({ user, performedBy: request.user })
  return sendSuccess(response, { message: 'User and all associated records deleted permanently', data: result })
}

export async function createUserPasswordReset(request, response) {
  const user = await User.findById(request.params.id).select('+resetPasswordToken +resetPasswordExpire')
  if (!user) throw new AppError('User not found', 404)

  const { token, hashedToken } = createPasswordResetToken()
  user.resetPasswordToken = hashedToken
  user.resetPasswordExpire = new Date(Date.now() + 30 * 60 * 1000)
  await user.save({ validateModifiedOnly: true })

  const resetUrl = `${env.clientUrl}/reset-password/${token}`
  const delivery = await sendEmailSafely({ to: user.email, ...passwordResetEmail(user, resetUrl) })
  const exposeResetUrl = env.nodeEnv === 'development' || delivery?.skipped || delivery?.failed

  return sendSuccess(response, {
    message: delivery?.skipped || delivery?.failed ? 'Password reset link created; email delivery is not configured' : 'Password reset instructions sent successfully',
    data: {
      email: user.email,
      emailDelivered: !delivery?.skipped && !delivery?.failed,
      expiresAt: user.resetPasswordExpire,
      ...(exposeResetUrl && { resetUrl }),
    },
  })
}
