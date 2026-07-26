import toast from 'react-hot-toast'
import { useDispatch, useSelector } from 'react-redux'
import { Outlet, useNavigate } from 'react-router-dom'
import AccountSidebar from '../components/account/AccountSidebar.jsx'
import NotificationBell from '../components/common/NotificationBell.jsx'
import { logoutUser } from '../redux/slices/authSlice.js'

function ProfileLayout() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { user, isLoading } = useSelector((state) => state.auth)
  const logout = async () => {
    try { await dispatch(logoutUser()).unwrap(); toast.success('You have been logged out.'); navigate('/') }
    catch (error) { toast.error(error?.message || 'Unable to log out.') }
  }
  return <section className="min-h-[60vh] bg-pink-light/25 py-7 sm:py-12">
    <div className="fixed inset-x-0 top-[4.75rem] z-40 border-b border-gold/15 bg-white/95 backdrop-blur-xl lg:hidden">
      <div className="section-shell py-2">
        <AccountSidebar onLogout={logout} loading={isLoading} compact />
      </div>
    </div>
    <div className="section-shell">
      <div className="h-[3.75rem] lg:hidden" aria-hidden="true" />
      <div className="mb-6 flex items-start justify-between gap-4 sm:mb-7"><div><p className="text-xs font-semibold uppercase tracking-[.2em] text-gold">My account</p><h1 className="mt-2 break-words font-serif text-3xl font-semibold sm:text-4xl">Hello, {user?.firstName}</h1></div><NotificationBell stackedMobile /></div>
      <div className="grid min-w-0 gap-5 sm:gap-6 lg:grid-cols-[250px_minmax(0,1fr)]"><div className="hidden lg:block"><AccountSidebar onLogout={logout} loading={isLoading} /></div><div className="min-w-0"><Outlet /></div></div>
    </div>
  </section>
}

export default ProfileLayout
