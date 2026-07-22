import { deleteImage, uploadImage } from '../utils/cloudinaryUtils.js'
import { AppError, sendSuccess } from '../utils/responseUtils.js'

export async function uploadSingleImage(request, response) { if (!request.file) throw new AppError('Select an image to upload', 422); const folder = ['products', 'banners', 'categories', 'settings'].includes(request.body.folder) ? request.body.folder : 'products'; const uploaded = await uploadImage(request.file, `eshaz-dream-world/${folder}`); const image = uploaded.url.startsWith('/') ? { ...uploaded, url: `${request.protocol}://${request.get('host')}${uploaded.url}` } : uploaded; return sendSuccess(response, { statusCode: 201, message: 'Image uploaded successfully', data: { image } }) }
export async function removeCloudinaryImage(request, response) { await deleteImage(request.body.publicId); return sendSuccess(response, { message: 'Image removed successfully' }) }
