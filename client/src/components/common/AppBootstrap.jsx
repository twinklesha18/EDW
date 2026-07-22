import { useEffect, useRef } from 'react'
import toast from 'react-hot-toast'
import { useDispatch, useSelector } from 'react-redux'
import { getCurrentUser, sessionExpired } from '../../redux/slices/authSlice.js'
import { syncGuestCart } from '../../redux/slices/cartSlice.js'
import { syncGuestWishlist } from '../../redux/slices/wishlistSlice.js'
import { fetchCatalog, refreshCatalog } from '../../redux/slices/catalogSlice.js'
import api from '../../services/api.js'

const configuredIdleMinutes = Number(import.meta.env?.VITE_SESSION_IDLE_TIMEOUT_MINUTES || 10)
const sessionIdleMilliseconds = Math.max(1, configuredIdleMinutes) * 60 * 1000
const sessionEventKey = 'edw_session_expired_at'

function AppBootstrap({ children }) {
  const dispatch = useDispatch()
  const { authChecked, isAuthenticated, user } = useSelector((state) => state.auth)
  const synchronizedUser = useRef(null)

  useEffect(() => { dispatch(getCurrentUser()) }, [dispatch])
  useEffect(() => { dispatch(fetchCatalog()) }, [dispatch])
  useEffect(() => {
    const reloadCatalog = () => { dispatch(refreshCatalog()); dispatch(fetchCatalog()) }
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

  if (!authChecked) return <div className="grid min-h-screen place-items-center bg-cream"><div className="text-center"><div className="mx-auto h-11 w-11 animate-spin rounded-full border-2 border-pink-primary border-t-rosewood" /><p className="mt-4 font-serif text-xl text-ink">Eshaz Dream World</p></div></div>
  return children
}
export default AppBootstrap
