import SiteSetting from '../models/SiteSetting.js'
import { defaultSiteSettings, getResolvedSiteSettings, publicSiteSettings } from '../services/siteSettingsService.js'
import { deleteImage } from '../utils/cloudinaryUtils.js'
import { AppError, sendSuccess } from '../utils/responseUtils.js'

export async function getPublicSiteSettings(_request, response) {
  const settings = await getResolvedSiteSettings()
  return sendSuccess(response, { message: 'Website settings retrieved', data: { settings: publicSiteSettings(settings) } })
}

export async function getAdminSiteSettings(_request, response) {
  return sendSuccess(response, { message: 'Website settings retrieved', data: { settings: await getResolvedSiteSettings() } })
}

export async function createSiteSettings(request, response) {
  if (await SiteSetting.exists({ key: 'store' })) throw new AppError('Website settings already exist; update the current settings instead', 409)
  const settings = await SiteSetting.create({ key: 'store', ...request.validatedBody, updatedBy: request.user._id })
  return sendSuccess(response, { statusCode: 201, message: 'Website settings created successfully', data: { settings } })
}

export async function updateSiteSettings(request, response) {
  const settings = await SiteSetting.findOne({ key: 'store' })
  if (!settings) throw new AppError('Website settings do not exist; create them first', 404)
  const previousLogo = settings.business?.logo?.publicId
  settings.business = request.validatedBody.business
  settings.contact = request.validatedBody.contact
  settings.bank = request.validatedBody.bank
  settings.shipping = request.validatedBody.shipping
  settings.updatedBy = request.user._id
  await settings.save()
  if (previousLogo && previousLogo !== settings.business?.logo?.publicId) await deleteImage(previousLogo).catch(() => {})
  return sendSuccess(response, { message: 'Website settings updated successfully', data: { settings } })
}

export async function deleteSiteSettings(_request, response) {
  const settings = await SiteSetting.findOneAndDelete({ key: 'store' })
  if (!settings) throw new AppError('Website settings do not exist', 404)
  if (settings.business?.logo?.publicId) await deleteImage(settings.business.logo.publicId).catch(() => {})
  return sendSuccess(response, { message: 'Website settings deleted and defaults restored', data: { settings: { ...defaultSiteSettings(), exists: false } } })
}
