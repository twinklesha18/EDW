import toast from 'react-hot-toast'
import { useDispatch, useSelector } from 'react-redux'
import { Outlet, useNavigate } from 'react-router-dom'
import AccountSidebar from '../components/account/AccountSidebar.jsx'
import { logoutUser } from '../redux/slices/authSlice.js'
function ProfileLayout() { const dispatch = useDispatch(), navigate = useNavigate(); const { user, isLoading } = useSelector((state) => state.auth); const logout = async () => { try { await dispatch(logoutUser()).unwrap(); toast.success('You have been logged out.'); navigate('/') } catch (error) { toast.error(error?.message || 'Unable to log out.') } }; return <section className="min-h-[60vh] bg-pink-light/25 py-7 sm:py-12"><div className="section-shell"><div className="mb-6 sm:mb-7"><p className="text-xs font-semibold uppercase tracking-[.2em] text-gold">My account</p><h1 className="mt-2 break-words font-serif text-3xl font-semibold sm:text-4xl">Hello, {user?.firstName}</h1></div><div className="grid min-w-0 gap-5 sm:gap-6 lg:grid-cols-[250px_minmax(0,1fr)]"><AccountSidebar onLogout={logout} loading={isLoading} /><div className="min-w-0"><Outlet /></div></div></div></section> }
export default ProfileLayout
