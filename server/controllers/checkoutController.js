import { getBankTransferConfig } from '../config/bankTransfer.js'
import { buildCheckoutQuote, createOrderFromQuote, publicQuote } from '../services/checkoutService.js'
import { notifyNormalOrderPlaced } from '../services/orderNotificationService.js'
import { deleteImage, uploadImage } from '../utils/cloudinaryUtils.js'
import { AppError, sendSuccess } from '../utils/responseUtils.js'

const absoluteImage = (request, image) => image.url.startsWith('/')
  ? { ...image, url: `${request.protocol}://${request.get('host')}${image.url}` }
  : image

export async function quoteCheckout(request, response) {
  const quote = await buildCheckoutQuote(request.user._id, request.validatedBody)
  return sendSuccess(response, { message: 'Checkout totals calculated', data: { quote: publicQuote(quote) } })
}

export async function createCashOnDeliveryOrder(request, response) {
  const quote = await buildCheckoutQuote(request.user._id, request.validatedBody)
  const { order } = await createOrderFromQuote({ user: request.user, quote, paymentMethod: 'COD' })
  await notifyNormalOrderPlaced(order, request.user)
  return sendSuccess(response, { statusCode: 201, message: 'Cash on Delivery order placed successfully', data: { order } })
}

export async function getCheckoutPaymentConfig(_request, response) {
  const bankTransfer = await getBankTransferConfig()
  return sendSuccess(response, {
    message: 'Checkout payment options retrieved',
    data: {
      methods: bankTransfer.available ? ['COD', 'Bank Transfer'] : ['COD'],
      bankTransfer: bankTransfer.available ? bankTransfer : { available: false },
    },
  })
}

export async function createBankTransferOrder(request, response) {
  if (!(await getBankTransferConfig()).available) throw new AppError('Bank transfer is not available until the owner configures the bank account details', 503)
  let paymentSlip = null
  try {
    paymentSlip = absoluteImage(request, await uploadImage(request.file, 'eshaz-dream-world/payment-slips'))
    const quote = await buildCheckoutQuote(request.user._id, request.validatedBody)
    const { order } = await createOrderFromQuote({
      user: request.user,
      quote,
      paymentMethod: 'Bank Transfer',
      paymentSlip,
      paymentReference: request.validatedBody.paymentReference,
    })
    await notifyNormalOrderPlaced(order, request.user)
    return sendSuccess(response, { statusCode: 201, message: 'Bank payment slip submitted for verification', data: { order } })
  } catch (error) {
    if (paymentSlip?.publicId) await deleteImage(paymentSlip.publicId).catch(() => {})
    throw error
  }
}
