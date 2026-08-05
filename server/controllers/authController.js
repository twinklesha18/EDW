import User from '../models/User.js'
import { env } from '../config/env.js'
import { clearAuthCookie, setAuthCookie } from '../utils/generateToken.js'
import { createPasswordResetOtp, createPasswordResetToken, hashResetToken, verifyPasswordResetOtpHash } from '../utils/passwordUtils.js'
import { AppError, sendSuccess } from '../utils/responseUtils.js'
import { passwordChangedEmail, passwordResetOtpEmail, welcomeEmail } from '../services/emailTemplates.js'
import { sendEmailSafely } from '../services/emailService.js'
import { notifyAdmins, notifySafely } from '../services/notificationService.js'

export async function register(request, response) {
  const existingUser = await User.exists({ email: request.validatedBody.email })
  if (existingUser) throw new AppError('An account with this email already exists', 409, [{ field: 'email', message: 'Email is already in use' }])

  const user = await User.create(request.validatedBody)
  setAuthCookie(response, user._id, false, Date.now(), user.sessionVersion)
  await Promise.all([
    sendEmailSafely({ to: user.email, ...welcomeEmail(user, env.clientUrl) }),
    notifySafely(() => notifyAdmins({
      type: 'new_user',
      title: 'New customer registration',
      message: `${user.firstName} ${user.lastName} registered with ${user.email}.`,
      link: `/admin/users?search=${encodeURIComponent(user.email)}`,
    })),
  ])
  return sendSuccess(response, { statusCode: 201, message: 'Welcome to Eshaz Dream World!', data: { user: user.toJSON() } })
}

export async function login(request, response) {
  const { email, password, rememberMe } = request.validatedBody
  const user = await User.findOne({ email }).select('+password +sessionVersion')

  if (!user || !user.isActive || !(await user.comparePassword(password))) throw new AppError('Invalid email or password', 401)

  setAuthCookie(response, user._id, rememberMe, Date.now(), user.sessionVersion)
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
  const { email } = request.validatedBody
  const user = await User.findOne({ email, isActive: true }).select('+resetPasswordToken +resetPasswordExpire +resetPasswordOtpHash +resetPasswordOtpExpire +resetPasswordOtpAttempts +resetPasswordOtpRequestedAt')
  const message = 'A 6-digit verification code has been sent to your registered email address.'
  const publicRecoveryData = { expiresInMinutes: env.passwordRecovery.otpMinutes }

  if (!user) throw new AppError('No active account is registered with this email address', 404, [{ field: 'email', message: 'Check the email or create a new account' }])

  const resendCutoff = Date.now() - env.passwordRecovery.resendSeconds * 1000
  if (user.resetPasswordOtpRequestedAt?.getTime() > resendCutoff) {
    throw new AppError(`Please wait ${env.passwordRecovery.resendSeconds} seconds before requesting another verification code`, 429)
  }

  const { otp, hashedOtp } = await createPasswordResetOtp()
  user.resetPasswordOtpHash = hashedOtp
  user.resetPasswordOtpExpire = new Date(Date.now() + env.passwordRecovery.otpMinutes * 60 * 1000)
  user.resetPasswordOtpAttempts = 0
  user.resetPasswordOtpRequestedAt = new Date()
  user.resetPasswordToken = undefined
  user.resetPasswordExpire = undefined
  await user.save({ validateModifiedOnly: true })

  const delivery = await sendEmailSafely({ to: user.email, ...passwordResetOtpEmail(user, otp, env.passwordRecovery.otpMinutes) })
  if (env.isProduction && (delivery?.failed || delivery?.skipped)) {
    user.resetPasswordOtpHash = undefined
    user.resetPasswordOtpExpire = undefined
    user.resetPasswordOtpAttempts = 0
    user.resetPasswordOtpRequestedAt = undefined
    await user.save({ validateModifiedOnly: true })
    throw new AppError('We could not send the verification email. Please try again shortly.', 503)
  }

  return sendSuccess(response, {
    message,
    data: env.nodeEnv === 'development' ? { ...publicRecoveryData, developmentOnly: true, developmentOtp: otp } : publicRecoveryData,
  })
}

export async function verifyPasswordResetOtp(request, response) {
  const { email, otp } = request.validatedBody
  const now = new Date()
  const user = await User.findOne({
    email,
    isActive: true,
    resetPasswordOtpExpire: { $gt: now },
    resetPasswordOtpAttempts: { $lt: env.passwordRecovery.maxAttempts },
  }).select('+resetPasswordToken +resetPasswordExpire +resetPasswordOtpHash +resetPasswordOtpExpire +resetPasswordOtpAttempts +resetPasswordOtpRequestedAt')

  if (!user || !(await verifyPasswordResetOtpHash(otp, user.resetPasswordOtpHash))) {
    const attemptedUser = user ? await User.findOneAndUpdate(
      {
        _id: user._id,
        resetPasswordOtpHash: user.resetPasswordOtpHash,
        resetPasswordOtpExpire: { $gt: now },
        resetPasswordOtpAttempts: { $lt: env.passwordRecovery.maxAttempts },
      },
      { $inc: { resetPasswordOtpAttempts: 1 } },
      { returnDocument: 'after' },
    ).select('+resetPasswordOtpAttempts +resetPasswordOtpHash') : null
    const remainingAttempts = attemptedUser ? Math.max(0, env.passwordRecovery.maxAttempts - attemptedUser.resetPasswordOtpAttempts) : 0
    if (attemptedUser && remainingAttempts === 0) {
      await User.updateOne(
        { _id: attemptedUser._id, resetPasswordOtpHash: attemptedUser.resetPasswordOtpHash },
        { $unset: { resetPasswordOtpHash: '', resetPasswordOtpExpire: '', resetPasswordOtpRequestedAt: '' }, $set: { resetPasswordOtpAttempts: 0 } },
      )
    }
    const message = remainingAttempts > 0
      ? `Incorrect verification code. ${remainingAttempts} attempt${remainingAttempts === 1 ? '' : 's'} remaining.`
      : 'Verification code is invalid, expired, or has reached the attempt limit. Request a new code.'
    throw new AppError(message, 400, [{ field: 'otp', message }])
  }

  const { token, hashedToken } = createPasswordResetToken()
  const verifiedUser = await User.findOneAndUpdate(
    {
      _id: user._id,
      resetPasswordOtpHash: user.resetPasswordOtpHash,
      resetPasswordOtpExpire: { $gt: now },
      resetPasswordOtpAttempts: { $lt: env.passwordRecovery.maxAttempts },
    },
    {
      $set: {
        resetPasswordToken: hashedToken,
        resetPasswordExpire: new Date(Date.now() + env.passwordRecovery.tokenMinutes * 60 * 1000),
        resetPasswordOtpAttempts: 0,
      },
      $unset: { resetPasswordOtpHash: '', resetPasswordOtpExpire: '', resetPasswordOtpRequestedAt: '' },
    },
    { returnDocument: 'after' },
  )
  if (!verifiedUser) throw new AppError('This verification code has already been used. Request a new code if necessary.', 409)

  return sendSuccess(response, {
    message: 'Email verified. You can now create a new password.',
    data: { resetToken: token, expiresInMinutes: env.passwordRecovery.tokenMinutes },
  })
}

export async function resetPassword(request, response) {
  const hashedToken = hashResetToken(request.params.token)
  const user = await User.findOne({ isActive: true, resetPasswordToken: hashedToken, resetPasswordExpire: { $gt: new Date() } }).select('+password +resetPasswordToken +resetPasswordExpire +resetPasswordOtpHash +resetPasswordOtpExpire +resetPasswordOtpAttempts +resetPasswordOtpRequestedAt +sessionVersion')
  if (!user) throw new AppError('Password reset session is invalid or has expired', 400)
  if (await user.comparePassword(request.validatedBody.password)) {
    throw new AppError('New password must be different from your current password', 422, [{ field: 'password', message: 'Choose a password you have not used for this account' }])
  }

  user.password = request.validatedBody.password
  user.resetPasswordToken = undefined
  user.resetPasswordExpire = undefined
  user.resetPasswordOtpHash = undefined
  user.resetPasswordOtpExpire = undefined
  user.resetPasswordOtpAttempts = 0
  user.resetPasswordOtpRequestedAt = undefined
  user.sessionVersion = Number(user.sessionVersion || 0) + 1
  await user.save()
  setAuthCookie(response, user._id, false, Date.now(), user.sessionVersion)
  await sendEmailSafely({ to: user.email, ...passwordChangedEmail(user, env.clientUrl) })
  return sendSuccess(response, { message: 'Password reset successful', data: { user: user.toJSON() } })
}
