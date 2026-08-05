import User from '../models/User.js'
import { AppError, sendSuccess } from '../utils/responseUtils.js'
import { clearAuthCookie, setAuthCookie } from '../utils/generateToken.js'
import { cascadeDeleteUser } from '../services/userDeletionService.js'
import { notifyAdmins, notifySafely } from '../services/notificationService.js'

export function getProfile(request, response) {
  return sendSuccess(response, { message: 'Profile retrieved', data: { user: request.user.toJSON() } })
}

export async function updateProfile(request, response) {
  Object.assign(request.user, request.validatedBody)
  await request.user.save()
  return sendSuccess(response, { message: 'Profile updated successfully', data: { user: request.user.toJSON() } })
}

export async function changePassword(request, response) {
  const user = await User.findById(request.user._id).select('+password +sessionVersion')
  if (!(await user.comparePassword(request.validatedBody.currentPassword))) throw new AppError('Current password is incorrect', 400, [{ field: 'currentPassword', message: 'Current password is incorrect' }])

  user.password = request.validatedBody.newPassword
  user.sessionVersion = Number(user.sessionVersion || 0) + 1
  await user.save()
  setAuthCookie(response, user._id, request.authSession?.rem === true, Date.now(), user.sessionVersion)
  return sendSuccess(response, { message: 'Password changed successfully' })
}

export async function logoutAllDevices(request, response) {
  const user = await User.findById(request.user._id).select('+password +sessionVersion')
  if (!user || !(await user.comparePassword(request.validatedBody.currentPassword))) {
    throw new AppError('Current password is incorrect', 400, [{ field: 'currentPassword', message: 'Current password is incorrect' }])
  }
  user.sessionVersion = Number(user.sessionVersion || 0) + 1
  await user.save({ validateModifiedOnly: true })
  clearAuthCookie(response)
  return sendSuccess(response, { message: 'You have been logged out from all devices' })
}

export async function deleteOwnAccount(request, response) {
  const user = await User.findById(request.user._id).select('+password')
  if (!user || !(await user.comparePassword(request.validatedBody.currentPassword))) {
    throw new AppError('Current password is incorrect', 400, [{ field: 'currentPassword', message: 'Current password is incorrect' }])
  }
  if (user.role === 'admin') throw new AppError('Administrator accounts cannot be deleted from customer settings', 409)

  const customerName = `${user.firstName} ${user.lastName}`.trim()
  const customerEmail = user.email
  const result = await cascadeDeleteUser({ user, performedBy: user })
  await notifySafely(() => notifyAdmins({
    type: 'customer_account_deleted',
    title: 'Customer account deleted',
    message: `${customerName} (${customerEmail}) permanently deleted their customer account. Audit reference: ${result.deletionLogId}.`,
    link: '/admin/user-deletion-logs',
  }))
  clearAuthCookie(response)
  return sendSuccess(response, { message: 'Your account and associated data were deleted permanently', data: result })
}

export async function addAddress(request, response) {
  const user = request.user
  if (user.addresses.length >= 5) throw new AppError('You can save a maximum of 5 addresses', 400)

  const address = { ...request.validatedBody }
  if (user.addresses.length === 0) address.isDefault = true
  if (address.isDefault) user.addresses.forEach((item) => { item.isDefault = false })
  user.addresses.push(address)
  await user.save()
  return sendSuccess(response, { statusCode: 201, message: 'Address saved successfully', data: { user: user.toJSON(), address: user.addresses.at(-1) } })
}

export async function updateAddress(request, response) {
  const address = request.user.addresses.id(request.params.addressId)
  if (!address) throw new AppError('Address not found', 404)

  const keepDefault = address.isDefault
  Object.assign(address, request.validatedBody)
  if (request.validatedBody.isDefault) request.user.addresses.forEach((item) => { item.isDefault = item._id.equals(address._id) })
  else if (keepDefault) address.isDefault = true
  await request.user.save()
  return sendSuccess(response, { message: 'Address updated successfully', data: { user: request.user.toJSON(), address } })
}

export async function deleteAddress(request, response) {
  const address = request.user.addresses.id(request.params.addressId)
  if (!address) throw new AppError('Address not found', 404)
  const wasDefault = address.isDefault
  request.user.addresses.pull(address._id)
  if (wasDefault && request.user.addresses.length) request.user.addresses[0].isDefault = true
  await request.user.save()
  return sendSuccess(response, { message: 'Address removed successfully', data: { user: request.user.toJSON() } })
}

export async function setDefaultAddress(request, response) {
  const address = request.user.addresses.id(request.params.addressId)
  if (!address) throw new AppError('Address not found', 404)
  request.user.addresses.forEach((item) => { item.isDefault = item._id.equals(address._id) })
  await request.user.save()
  return sendSuccess(response, { message: 'Default address updated', data: { user: request.user.toJSON() } })
}
