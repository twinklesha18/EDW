import api from './api.js'

export const checkoutApi = {
  quote: (body) => api.post('/checkout/quote', body).then((response) => response.data.data.quote),
  createCodOrder: (body) => api.post('/checkout/cod', body).then((response) => response.data.data.order),
  createStripeIntent: (body) => api.post('/payments/stripe/intent', body).then((response) => response.data.data),
  verifyStripe: (paymentIntentId) => api.post('/payments/stripe/verify', { paymentIntentId }).then((response) => response.data.data.order),
  recordStripeFailure: (paymentIntentId) => api.post('/payments/stripe/failure', { paymentIntentId }),
  listOrders: (params) => api.get('/orders', { params }).then((response) => response.data.data),
  getOrder: (orderNumber) => api.get(`/orders/${orderNumber}`).then((response) => response.data.data.order),
  trackOrder: (body) => api.post('/orders/track', body).then((response) => response.data.data.order),
  cancelOrder: (orderNumber) => api.post(`/orders/${orderNumber}/cancel`).then((response) => response.data.data.order),
  reorder: (orderNumber) => api.post(`/orders/${orderNumber}/reorder`).then((response) => response.data.data.cart),
  invoice: (orderNumber) => api.get(`/orders/${orderNumber}/invoice`, { responseType: 'blob' }).then((response) => response.data),
}

export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url; link.download = filename; document.body.appendChild(link); link.click(); link.remove()
  URL.revokeObjectURL(url)
}
