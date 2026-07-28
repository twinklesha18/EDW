import { useEffect, useRef } from 'react'
import toast from 'react-hot-toast'
import { useDispatch, useSelector } from 'react-redux'
import { useLocation } from 'react-router-dom'
import { getCurrentUser, sessionExpired } from '../../redux/slices/authSlice.js'
import { syncGuestCart } from '../../redux/slices/cartSlice.js'
import { syncGuestWishlist } from '../../redux/slices/wishlistSlice.js'
import { fetchCatalog, refreshCatalog } from '../../redux/slices/catalogSlice.js'
import api from '../../services/api.js'
import { invalidateStorefrontBootstrap } from '../../services/storefrontApi.js'
import { isSearchCrawler } from '../../utils/crawler.js'

const configuredIdleMinutes = Number(import.meta.env?.VITE_SESSION_IDLE_TIMEOUT_MINUTES || 10)
const sessionIdleMilliseconds = Math.max(1, configuredIdleMinutes) * 60 * 1000
const sessionEventKey = 'edw_session_expired_at'
const authRequiredPath = /^\/(?:admin|profile|checkout|wishlist|orders?|order-success|order-failed|custom-orders|login|register|forgot-password|reset-password)(?:\/|$)/i

function AppBootstrap({ children }) {
  const dispatch = useDispatch()
  const { pathname } = useLocation()
  const { isAuthenticated, user } = useSelector((state) => state.auth)
  const synchronizedUser = useRef(null)

  useEffect(() => {
    if (isSearchCrawler()) return undefined
    if (authRequiredPath.test(pathname)) {
      dispatch(getCurrentUser())
      return undefined
    }
    const timeoutId = window.setTimeout(() => dispatch(getCurrentUser()), 3500)
    return () => window.clearTimeout(timeoutId)
  }, [dispatch, pathname])
  useEffect(() => { dispatch(fetchCatalog()) }, [dispatch])
  useEffect(() => {
    const reloadCatalog = () => {
      invalidateStorefrontBootstrap()
      dispatch(refreshCatalog())
      dispatch(fetchCatalog())
    }
    window.addEventListener('edw:catalog-updated', reloadCatalog)
    return () => window.removeEventListener('edw:catalog-updated', reloadCatalog)
  }, [dispatch])
  useEffect(() => {
    const expire = () => {
      if (isAuthenticated) toast.error('Your session has expired. Please log in again.')
      dispatch(sessionExpired())
      localStorage.setItem(sessionEventKey, String(Date.now()))
    }
    window.addEventListener('edw:unauthorized', expire)
    return () => window.removeEventListener('edw:unauthorized', expire)
  }, [dispatch, isAuthenticated])
  useEffect(() => {
    if (!isAuthenticated) return undefined
    let timeoutId
    let deadline = Date.now() + sessionIdleMilliseconds
    const schedule = () => {
      deadline = Date.now() + sessionIdleMilliseconds
      window.clearTimeout(timeoutId)
      timeoutId = window.setTimeout(expire, sessionIdleMilliseconds)
    }
    const expire = () => {
      window.clearTimeout(timeoutId)
      dispatch(sessionExpired())
      localStorage.setItem(sessionEventKey, String(Date.now()))
      void api.post('/auth/logout').catch(() => {})
      toast.error(`You were logged out after ${configuredIdleMinutes} minutes of inactivity.`)
    }
    const checkDeadline = () => {
      if (document.visibilityState === 'visible' && Date.now() >= deadline) expire()
    }
    const syncExpiry = (event) => {
      if (event.key !== sessionEventKey) return
      window.clearTimeout(timeoutId)
      dispatch(sessionExpired())
      toast.error('Your session ended in another browser tab.')
    }
    const activityEvents = ['pointerdown', 'keydown', 'scroll', 'touchstart']
    activityEvents.forEach((eventName) => window.addEventListener(eventName, schedule, { passive: true }))
    document.addEventListener('visibilitychange', checkDeadline)
    window.addEventListener('storage', syncExpiry)
    schedule()
    return () => {
      window.clearTimeout(timeoutId)
      activityEvents.forEach((eventName) => window.removeEventListener(eventName, schedule))
      document.removeEventListener('visibilitychange', checkDeadline)
      window.removeEventListener('storage', syncExpiry)
    }
  }, [dispatch, isAuthenticated])
  useEffect(() => {
    if (isAuthenticated && user?.id && synchronizedUser.current !== user.id) {
      synchronizedUser.current = user.id
      dispatch(syncGuestCart())
      dispatch(syncGuestWishlist())
    }
    if (!isAuthenticated) synchronizedUser.current = null
  }, [dispatch, isAuthenticated, user?.id])

  return children
}
export default AppBootstrap
