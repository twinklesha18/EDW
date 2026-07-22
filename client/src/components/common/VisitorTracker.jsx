import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import api from '../../services/api.js'

const visitorKey = 'edw_visitor_id'
const sessionKey = 'edw_visit_session_id'
const lastPageViewKey = 'edw_last_page_view'
const privateRoutePattern = /^\/(?:admin|profile|checkout|cart|wishlist|login|register|forgot-password|reset-password|orders|order|order-success|order-failed)(?:\/|$)/i

const createIdentifier = () => {
  if (typeof crypto?.randomUUID === 'function') return crypto.randomUUID()
  const bytes = new Uint8Array(16)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('')
}

const getIdentifier = (storage, key) => {
  try {
    const existing = storage.getItem(key)
    if (existing) return existing
    const value = createIdentifier()
    storage.setItem(key, value)
    return value
  } catch {
    return createIdentifier()
  }
}

const sendVisit = (eventType, path) => {
  const visitorId = getIdentifier(localStorage, visitorKey)
  const sessionId = getIdentifier(sessionStorage, sessionKey)
  void api.post('/analytics/visit', { visitorId, sessionId, path, eventType }).catch(() => {})
}

function VisitorTracker() {
  const { pathname } = useLocation()
  const trackable = !privateRoutePattern.test(pathname)

  useEffect(() => {
    if (!trackable || navigator.webdriver) return
    const now = Date.now()
    const currentKey = `${pathname}|${now}`
    try {
      const [lastPath, lastTime] = String(sessionStorage.getItem(lastPageViewKey) || '').split('|')
      if (lastPath === pathname && now - Number(lastTime || 0) < 3000) return
      sessionStorage.setItem(lastPageViewKey, currentKey)
    } catch {
      // Analytics must never interrupt navigation when storage is unavailable.
    }
    sendVisit('pageview', pathname)
  }, [pathname, trackable])

  useEffect(() => {
    if (!trackable || navigator.webdriver) return undefined
    const heartbeat = () => {
      if (document.visibilityState === 'visible') sendVisit('heartbeat', pathname)
    }
    const intervalId = window.setInterval(heartbeat, 2 * 60 * 1000)
    return () => window.clearInterval(intervalId)
  }, [pathname, trackable])

  return null
}

export default VisitorTracker
