import { env } from '../config/env.js'
import { buildCheckoutQuote, createOrderFromQuote, publicQuote } from '../services/checkoutService.js'
import { orderConfirmationEmail } from '../services/emailTemplates.js'
import { sendEmailSafely } from '../services/emailService.js'
import { sendSuccess } from '../utils/responseUtils.js'

export async function quoteCheckout(request, response) {
  const quote = await buildCheckoutQuote(request.user._id, request.validatedBody)
  return sendSuccess(response, { message: 'Checkout totals calculated', data: { quote: publicQuote(quote) } })
}

export async function createCashOnDeliveryOrder(request, response) {
  const quote = await buildCheckoutQuote(request.user._id, request.validatedBody)
  const { order } = await createOrderFromQuote({ user: request.user, quote, paymentMethod: 'COD' })
  void sendEmailSafely({ to: request.user.email, ...orderConfirmationEmail(request.user, order, env.clientOrigins[0]) })
  return sendSuccess(response, { statusCode: 201, message: 'Cash on Delivery order placed successfully', data: { order } })
}
