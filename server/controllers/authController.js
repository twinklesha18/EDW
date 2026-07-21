import User from '../models/User.js'
import { env } from '../config/env.js'
import { clearAuthCookie, setAuthCookie } from '../utils/generateToken.js'
import { createPasswordResetToken, hashResetToken } from '../utils/passwordUtils.js'
import { AppError, sendSuccess } from '../utils/responseUtils.js'
import { passwordResetEmail, welcomeEmail } from '../services/emailTemplates.js'
import { sendEmailSafely } from '../services/emailService.js'

export async function register(request, response) {
  const existingUser = await User.exists({ email: request.validatedBody.email })
  if (existingUser) throw new AppError('An account with this email already exists', 409, [{ field: 'email', message: 'Email is already in use' }])

  const user = await User.create(request.validatedBody)
  setAuthCookie(response, user._id)
  void sendEmailSafely({ to: user.email, ...welcomeEmail(user, env.clientOrigins[0]) })
  return sendSuccess(response, { statusCode: 201, message: 'Welcome to Eshaz Dream World!', data: { user: user.toJSON() } })
}

export async function login(request, response) {
  const { email, password, rememberMe } = request.validatedBody
  const user = await User.findOne({ email }).select('+password')

  if (!user || !user.isActive || !(await user.comparePassword(password))) throw new AppError('Invalid email or password', 401)

  setAuthCookie(response, user._id, rememberMe)
  return sendSuccess(response, { message: 'Login successful', data: { user: user.toJSON() } })
}

export function logout(_request, response) {
  clearAuthCookie(response)
  return sendSuccess(response, { message: 'You have been logged out' })
}

export function getCurrentUser(request, response) {
  return sendSuccess(response, { message: 'Authenticated user retrieved', data: { user: request.user.toJSON() } })
}

export async function forgotPassword(request, response) {
  const user = await User.findOne({ email: request.validatedBody.email }).select('+resetPasswordToken +resetPasswordExpire')
  let developmentResetUrl

  if (user) {
    const { token, hashedToken } = createPasswordResetToken()
    user.resetPasswordToken = hashedToken
    user.resetPasswordExpire = new Date(Date.now() + 30 * 60 * 1000)
    await user.save({ validateModifiedOnly: true })
    const resetUrl = `${env.clientOrigins[0]}/reset-password/${token}`
    void sendEmailSafely({ to: user.email, ...passwordResetEmail(user, resetUrl) })
    if (env.nodeEnv === 'development') developmentResetUrl = resetUrl
  }

  return sendSuccess(response, {
    message: 'If an account matches that email, password reset instructions have been prepared',
    data: developmentResetUrl ? { developmentOnly: true, resetUrl: developmentResetUrl } : {},
  })
}

export async function resetPassword(request, response) {
  const hashedToken = hashResetToken(request.params.token)
  const user = await User.findOne({ resetPasswordToken: hashedToken, resetPasswordExpire: { $gt: new Date() } }).select('+password +resetPasswordToken +resetPasswordExpire')
  if (!user) throw new AppError('Password reset link is invalid or has expired', 400)

  user.password = request.validatedBody.password
  user.resetPasswordToken = undefined
  user.resetPasswordExpire = undefined
  await user.save()
  setAuthCookie(response, user._id)
  return sendSuccess(response, { message: 'Password reset successful', data: { user: user.toJSON() } })
}
