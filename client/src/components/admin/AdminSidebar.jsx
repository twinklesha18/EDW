import {
  FiBarChart2,
  FiBox,
  FiClipboard,
  FiHome,
  FiImage,
  FiLayers,
  FiLogOut,
  FiPercent,
  FiSettings,
  FiShoppingBag,
  FiStar,
  FiUsers,
  FiX,
} from 'react-icons/fi'
import { NavLink } from 'react-router-dom'
import Logo from '../layout/Logo.jsx'

const links = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: FiBarChart2 },
  { to: '/admin/products', label: 'Products', icon: FiBox },
  { to: '/admin/categories', label: 'Categories', icon: FiLayers },
  { to: '/admin/orders', label: 'Orders', icon: FiShoppingBag },
  { to: '/admin/custom-orders', label: 'Custom Orders', icon: FiClipboard },
  { to: '/admin/users', label: 'Users', icon: FiUsers },
  { to: '/admin/reviews', label: 'Reviews', icon: FiStar },
  { to: '/admin/coupons', label: 'Coupons', icon: FiPercent },
  { to: '/admin/banners', label: 'Banners', icon: FiImage },
  { to: '/admin/settings', label: 'Settings', icon: FiSettings },
]

function AdminSidebar({ open, onClose, onLogout, loggingOut }) {
  return (
    <>
      <button
        type="button"
        aria-label="Close admin navigation"
        onClick={onClose}
        className={`fixed inset-0 z-[55] bg-ink/25 backdrop-blur-sm transition-opacity lg:hidden ${
          open ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
      />
      <aside
        className={`fixed inset-y-0 left-0 z-[60] flex w-[min(88vw,18rem)] flex-col border-r border-gold/15 bg-white transition-transform lg:w-72 lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-gold/15 px-4 sm:h-20 sm:px-5">
          <Logo />
          <button type="button" onClick={onClose} className="icon-button lg:hidden" aria-label="Close navigation">
            <FiX />
          </button>
        </div>
        <div className="px-4 py-3 sm:px-5 sm:py-4">
          <p className="rounded-xl bg-ink px-3 py-3 text-center text-[.68rem] font-bold uppercase tracking-[.18em] text-white sm:px-4 sm:tracking-[.2em]">
            Admin Console
          </p>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto overscroll-contain px-3 pb-5 sm:px-4" aria-label="Admin navigation">
          {links.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={onClose}
              className={({ isActive }) =>
                `flex min-h-11 items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors ${
                  isActive ? 'bg-pink-light text-rosewood' : 'text-muted hover:bg-cream hover:text-ink'
                }`
              }
            >
              <Icon />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="safe-area-bottom m-3 shrink-0 space-y-2 border-t border-gold/15 pt-3 sm:m-4 sm:pt-4">
          <NavLink
            to="/"
            onClick={onClose}
            className="flex min-h-11 items-center justify-center gap-2 rounded-xl border border-gold/20 px-4 py-3 text-xs font-semibold text-muted hover:bg-pink-light"
          >
            <FiHome /> View Storefront
          </NavLink>
          <button
            type="button"
            onClick={onLogout}
            disabled={loggingOut}
            className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-60"
          >
            <FiLogOut /> {loggingOut ? 'Logging out…' : 'Logout'}
          </button>
        </div>
      </aside>
    </>
  )
}

export default AdminSidebar
