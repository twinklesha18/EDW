import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env?.VITE_API_URL ?? 'http://localhost:5000/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 12000,
  withCredentials: true,
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isExpectedAuthRequest = ['/auth/login', '/auth/register', '/auth/me', '/auth/forgot-password', '/auth/reset-password'].some((path) => error.config?.url?.includes(path))
    if (error.response?.status === 401 && !isExpectedAuthRequest && typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('edw:unauthorized'))
    return Promise.reject(error)
  },
)

export function getApiError(error, fallback = 'Something went wrong. Please try again.') {
  return {
    message: error.response?.data?.message || fallback,
    errors: Array.isArray(error.response?.data?.errors) ? error.response.data.errors : [],
    status: error.response?.status,
  }
}

export default api
