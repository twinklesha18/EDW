import api from './api.js'

export const adminApi = {
  list: (resource, params) => api.get(`/admin/${resource}`, { params }).then((response) => response.data.data),
  get: (resource, id) => api.get(`/admin/${resource}/${id}`).then((response) => response.data.data),
  create: (resource, body) => api.post(`/admin/${resource}`, body).then((response) => response.data),
  update: (resource, id, body) => api.put(`/admin/${resource}/${id}`, body).then((response) => response.data),
  remove: (resource, id) => api.delete(`/admin/${resource}/${id}`).then((response) => response.data),
  removePermanently: (resource, id) => api.delete(`/admin/${resource}/${id}/permanent`).then((response) => response.data),
  patch: (resource, id, action, body) => api.patch(`/admin/${resource}/${id}/${action}`, body).then((response) => response.data),
  dashboard: () => api.get('/admin/dashboard').then((response) => response.data.data),
  search: (query) => api.get('/admin/search', { params: { q: query } }).then((response) => response.data.data),
  invoice: (orderId) => api.get(`/admin/orders/${orderId}/invoice`, { responseType: 'blob' }).then((response) => response.data),
}

export async function uploadSingleImage(file, folder) {
  const formData = new FormData(); formData.append('image', file); formData.append('folder', folder)
  return (await api.post('/admin/uploads/single', formData, { headers: { 'Content-Type': 'multipart/form-data' }, timeout: 60000 })).data.data.image
}

export const removeUploadedImage = (publicId) => api.delete('/admin/uploads', { data: { publicId } })
