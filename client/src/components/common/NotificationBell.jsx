import { AnimatePresence, motion } from 'framer-motion'
import { useCallback, useEffect, useRef, useState } from 'react'
import { FiBell, FiCheck, FiPackage, FiX } from 'react-icons/fi'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'
import api from '../../services/api.js'

const dateLabel = (value) => {
  const date = new Date(value)
  const seconds = Math.round((date.getTime() - Date.now()) / 1000)
  const formatter = new Intl.RelativeTimeFormat('en', { numeric: 'auto' })
  if (Math.abs(seconds) < 60) return formatter.format(seconds, 'second')
  const minutes = Math.round(seconds / 60)
  if (Math.abs(minutes) < 60) return formatter.format(minutes, 'minute')
  const hours = Math.round(minutes / 60)
  if (Math.abs(hours) < 24) return formatter.format(hours, 'hour')
  return date.toLocaleDateString()
}

function NotificationBell() {
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const latestId = useRef('')
  const initialized = useRef(false)
  const panelRef = useRef(null)
  const navigate = useNavigate()

  const load = useCallback(async ({ announce = false } = {}) => {
    try {
      const response = await api.get('/notifications', { params: { limit: 12 } })
      const data = response.data.data
      const newest = data.notifications?.[0]
      if (announce && initialized.current && newest?.id && latestId.current && newest.id !== latestId.current) toast(newest.title, { icon: '🔔' })
      latestId.current = newest?.id || latestId.current
      initialized.current = true
      setNotifications(data.notifications || [])
      setUnreadCount(data.unreadCount || 0)
    } catch { /* The global authentication handler manages expired sessions. */ }
    finally { setLoading(false) }
  }, [])

  useEffect(() => {
    void load()
    const interval = window.setInterval(() => { if (document.visibilityState === 'visible') void load({ announce: true }) }, 15000)
    const refresh = () => void load({ announce: true })
    window.addEventListener('focus', refresh)
    return () => { window.clearInterval(interval); window.removeEventListener('focus', refresh) }
  }, [load])

  useEffect(() => {
    const close = (event) => {
      if (event.key === 'Escape' || (event.type === 'mousedown' && !panelRef.current?.contains(event.target))) setOpen(false)
    }
    document.addEventListener('mousedown', close)
    document.addEventListener('keydown', close)
    return () => { document.removeEventListener('mousedown', close); document.removeEventListener('keydown', close) }
  }, [])

  const openNotification = async (notification) => {
    if (!notification.readAt) {
      setNotifications((current) => current.map((item) => item.id === notification.id ? { ...item, readAt: new Date().toISOString() } : item))
      setUnreadCount((current) => Math.max(0, current - 1))
      try { await api.patch(`/notifications/${notification.id}/read`) } catch { void load() }
    }
    setOpen(false)
    if (notification.link) navigate(notification.link)
  }

  const markAllRead = async () => {
    setNotifications((current) => current.map((item) => ({ ...item, readAt: item.readAt || new Date().toISOString() })))
    setUnreadCount(0)
    try { await api.patch('/notifications/read-all') }
    catch { toast.error('Unable to mark notifications as read.'); void load() }
  }

  return <div ref={panelRef} className="relative">
    <button type="button" className="icon-button" aria-label={`Notifications, ${unreadCount} unread`} aria-expanded={open} onClick={() => setOpen((value) => !value)}>
      <FiBell />
      {unreadCount > 0 && <span className="count-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>}
    </button>
    <AnimatePresence>{open && <motion.section initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="fixed inset-x-3 top-[4.5rem] z-[80] max-h-[min(75dvh,36rem)] overflow-hidden rounded-2xl border border-gold/15 bg-white shadow-2xl sm:absolute sm:inset-x-auto sm:right-0 sm:top-full sm:mt-3 sm:w-[25rem]" aria-label="Notifications">
      <header className="flex items-center justify-between border-b border-gold/10 p-4"><div><h2 className="font-serif text-xl font-semibold">Notifications</h2><p className="text-xs text-muted">{unreadCount ? `${unreadCount} unread` : 'You are all caught up'}</p></div><div className="flex gap-1">{unreadCount > 0 && <button type="button" className="icon-button" title="Mark all as read" aria-label="Mark all notifications as read" onClick={markAllRead}><FiCheck /></button>}<button type="button" className="icon-button sm:hidden" aria-label="Close notifications" onClick={() => setOpen(false)}><FiX /></button></div></header>
      <div className="max-h-[calc(min(75dvh,36rem)-5rem)] overflow-y-auto overscroll-contain">
        {loading ? <p className="p-6 text-center text-sm text-muted">Loading notifications…</p> : notifications.length === 0 ? <div className="p-8 text-center"><FiBell className="mx-auto text-2xl text-rosewood" /><p className="mt-3 font-semibold">No notifications yet</p><p className="mt-1 text-xs text-muted">Important order updates will appear here.</p></div> : notifications.map((notification) => <button key={notification.id} type="button" onClick={() => openNotification(notification)} className={`flex w-full gap-3 border-b border-gold/10 p-4 text-left transition hover:bg-pink-light/35 ${notification.readAt ? 'bg-white' : 'bg-pink-light/25'}`}><span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white text-rosewood shadow-sm"><FiPackage /></span><span className="min-w-0 flex-1"><span className="flex items-start justify-between gap-2"><strong className="text-sm leading-5">{notification.title}</strong>{!notification.readAt && <i className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-rosewood" />}</span><span className="mt-1 block text-xs leading-5 text-muted">{notification.message}</span><time className="mt-1 block text-[.68rem] font-semibold text-gold">{dateLabel(notification.createdAt)}</time></span></button>)}
      </div>
    </motion.section>}</AnimatePresence>
  </div>
}

export default NotificationBell
