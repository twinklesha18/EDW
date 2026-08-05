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

const unsafeMethods = new Set(['post', 'put', 'patch', 'delete'])
let csrfToken = ''
let csrfRequest

const readCsrfCookie = () => {
  if (typeof document === 'undefined') return ''
  for (const name of ['__Host-edw_csrf', 'edw_csrf']) {
    const prefix = `${encodeURIComponent(name)}=`
    const entry = document.cookie.split('; ').find((cookie) => cookie.startsWith(prefix))
    if (entry) return decodeURIComponent(entry.slice(prefix.length))
  }
  return ''
}

const obtainCsrfToken = async ({ force = false } = {}) => {
  if (!force) {
    const cookieToken = readCsrfCookie()
    if (cookieToken) return cookieToken
  } else {
    csrfToken = ''
    csrfRequest = undefined
  }
  if (!csrfRequest) {
    csrfRequest = api.get('/auth/csrf-token')
      .then((response) => response.data.data.csrfToken)
      .finally(() => { csrfRequest = undefined })
  }
  csrfToken = await csrfRequest
  return csrfToken
}

api.interceptors.request.use(async (configuration) => {
  if (!unsafeMethods.has(String(configuration.method || 'get').toLowerCase())) return configuration
  const token = readCsrfCookie() || csrfToken || await obtainCsrfToken()
  configuration.headers.set('X-CSRF-Token', token)
  return configuration
})

api.interceptors.response.use(
  (response) => {
    const rotatedToken = response.headers?.['x-csrf-token']
    if (rotatedToken) csrfToken = rotatedToken
    return response
  },
  async (error) => {
    const rotatedToken = error.response?.headers?.['x-csrf-token']
    if (rotatedToken) csrfToken = rotatedToken
    const isExpectedAuthRequest = ['/auth/login', '/auth/register', '/auth/me', '/auth/forgot-password', '/auth/verify-reset-otp', '/auth/reset-password'].some((path) => error.config?.url?.includes(path))
    if (error.response?.status === 401 && !isExpectedAuthRequest && typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('edw:unauthorized'))
    const csrfRejected = error.response?.status === 403 && /security token/i.test(error.response?.data?.message || '')
    if (csrfRejected && error.config && !error.config._csrfRetried) {
      error.config._csrfRetried = true
      try {
        const freshToken = await obtainCsrfToken({ force: true })
        if (typeof error.config.headers?.set === 'function') error.config.headers.set('X-CSRF-Token', freshToken)
        else error.config.headers = { ...error.config.headers, 'X-CSRF-Token': freshToken }
        return api.request(error.config)
      } catch {
        csrfToken = ''
      }
    }
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
