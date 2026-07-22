import api from './api.js'

export const checkoutApi = {
  quote: (body) => api.post('/checkout/quote', body).then((response) => response.data.data.quote),
  paymentConfig: () => api.get('/checkout/payment-config').then((response) => response.data.data),
  createCodOrder: (body) => api.post('/checkout/cod', body).then((response) => response.data.data.order),
  createBankTransferOrder: (body, paymentSlip, paymentReference = '') => {
    const formData = new FormData()
    formData.append('checkout', JSON.stringify(body))
    formData.append('paymentSlip', paymentSlip)
    formData.append('paymentReference', paymentReference)
    return api.post('/checkout/bank-transfer', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 60000,
    }).then((response) => response.data.data.order)
  },
  listOrders: (params) => api.get('/orders', { params }).then((response) => response.data.data),
  getOrder: (orderNumber) => api.get(`/orders/${orderNumber}`).then((response) => response.data.data.order),
  trackOrder: (body) => api.post('/orders/track', body).then((response) => response.data.data.order),
  cancelOrder: (orderNumber, reason) => api.post(`/orders/${orderNumber}/cancel`, { reason }).then((response) => response.data.data.order),
  reorder: (orderNumber) => api.post(`/orders/${orderNumber}/reorder`).then((response) => response.data.data.cart),
  createReview: (body) => api.post('/reviews', body).then((response) => response.data.data.review),
  resubmitPaymentSlip: (orderNumber, paymentSlip, paymentReference = '') => {
    const formData = new FormData()
    formData.append('paymentSlip', paymentSlip)
    formData.append('paymentReference', paymentReference)
    return api.post(`/orders/${orderNumber}/payment-slip`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 60000,
    }).then((response) => response.data.data.order)
  },
  invoice: (orderNumber) => api.get(`/orders/${orderNumber}/invoice`, { responseType: 'blob' }).then((response) => response.data),
}

export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url; link.download = filename; document.body.appendChild(link); link.click(); link.remove()
  URL.revokeObjectURL(url)
}
