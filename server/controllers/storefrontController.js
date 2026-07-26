import { getStorefrontBootstrapData } from '../services/storefrontService.js'
import { sendSuccess } from '../utils/responseUtils.js'

export async function getStorefrontBootstrap(_request, response) {
  return sendSuccess(response, {
    message: 'Storefront data retrieved',
    data: await getStorefrontBootstrapData(),
  })
}

