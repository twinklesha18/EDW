import { useEffect, useState } from 'react'
import { FiMenu, FiUser } from 'react-icons/fi'
import toast from 'react-hot-toast'
import { useDispatch, useSelector } from 'react-redux'
import { Outlet, useNavigate } from 'react-router-dom'
import AdminGlobalSearch from '../components/admin/AdminGlobalSearch.jsx'
import AdminSidebar from '../components/admin/AdminSidebar.jsx'
import NotificationBell from '../components/common/NotificationBell.jsx'
import { logoutUser } from '../redux/slices/authSlice.js'

function AdminLayout() {
  const [open, setOpen] = useState(false)
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { user, isLoading } = useSelector((state) => state.auth)

  useEffect(() => {
    if (!open) return undefined
    const closeOnEscape = (event) => event.key === 'Escape' && setOpen(false)
    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', closeOnEscape)
    return () => {
      document.body.style.overflow = ''
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [open])

  const logout = async () => {
    try {
      await dispatch(logoutUser()).unwrap()
      toast.success('You have been logged out.')
      navigate('/', { replace: true })
    } catch (error) {
      toast.error(error?.message || 'Unable to log out.')
    }
  }

  return (
    <div className="min-h-screen bg-[#fffafc]">
      <AdminSidebar
        open={open}
        onClose={() => setOpen(false)}
        onLogout={logout}
        loggingOut={isLoading}
      />
      <div className="min-w-0 lg:pl-72">
        <header className="sticky top-0 z-40 flex h-16 min-w-0 items-center gap-1.5 border-b border-gold/15 bg-white/90 px-2 backdrop-blur-xl sm:h-20 sm:gap-3 sm:px-7">
          <button
            type="button"
            className="icon-button lg:hidden"
            onClick={() => setOpen(true)}
            aria-label="Open admin navigation"
          >
            <FiMenu />
          </button>
          <AdminGlobalSearch />
          <div className="ml-auto flex shrink-0 items-center gap-1 sm:gap-2">
            <NotificationBell />
            <div className="hidden items-center gap-2 rounded-full border border-gold/20 px-3 py-2 sm:flex">
              <FiUser className="text-rosewood" />
              <span className="text-xs font-semibold">{user?.firstName} · Admin</span>
            </div>
          </div>
        </header>
        <main className="min-w-0 p-3 sm:p-7 lg:p-9">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default AdminLayout
