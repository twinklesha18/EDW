import User from '../models/User.js'
import { AppError, sendSuccess } from '../utils/responseUtils.js'

export function getProfile(request, response) {
  return sendSuccess(response, { message: 'Profile retrieved', data: { user: request.user.toJSON() } })
}

export async function updateProfile(request, response) {
  Object.assign(request.user, request.validatedBody)
  await request.user.save()
  return sendSuccess(response, { message: 'Profile updated successfully', data: { user: request.user.toJSON() } })
}

export async function changePassword(request, response) {
  const user = await User.findById(request.user._id).select('+password')
  if (!(await user.comparePassword(request.validatedBody.currentPassword))) throw new AppError('Current password is incorrect', 400, [{ field: 'currentPassword', message: 'Current password is incorrect' }])

  user.password = request.validatedBody.newPassword
  await user.save()
  return sendSuccess(response, { message: 'Password changed successfully' })
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
