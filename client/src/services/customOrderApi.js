import api from './api.js'

export const customOrderApi = {
  list: (params) => api.get('/custom-orders', { params }).then((response) => response.data.data),
  get: (id) => api.get(`/custom-orders/${id}`).then((response) => response.data.data.customOrder),
  paymentConfig: () => api.get('/custom-orders/payment-config').then((response) => response.data.data),
  submitPayment: (id, formData) => api.post(`/custom-orders/${id}/payment`, formData, { timeout: 60000 }).then((response) => response.data.data.customOrder),
  cancel: (id) => api.post(`/custom-orders/${id}/cancel`).then((response) => response.data.data.customOrder),
}
