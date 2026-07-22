import axios from 'axios'

const configuredApiUrl = String(import.meta.env?.VITE_API_URL || '').trim().replace(/\/$/, '')
const browserHostname = typeof window === 'undefined' ? '' : window.location?.hostname || ''
const isLocalBrowser = !browserHostname || ['localhost', '127.0.0.1'].includes(browserHostname)
const apiBaseUrl = isLocalBrowser ? (configuredApiUrl || 'http://localhost:5000/api') : '/api'

const api = axios.create({
  baseURL: apiBaseUrl,
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
