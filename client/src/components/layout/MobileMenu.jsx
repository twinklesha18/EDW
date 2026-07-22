import { AnimatePresence, motion } from 'framer-motion'
import { useEffect } from 'react'
import { FiHeart, FiLogIn, FiLogOut, FiShoppingBag, FiUser, FiX } from 'react-icons/fi'
import { Link, NavLink } from 'react-router-dom'
import { primaryNavigation } from '../../data/navigation.js'
import Logo from './Logo.jsx'
function MobileMenu({ isOpen, onClose, user, isAuthenticated, cartCount, wishlistCount, onCart, onLogout }) {
  useEffect(() => {
    if (!isOpen) return undefined
    const handleEscape = (event) => event.key === 'Escape' && onClose()
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen, onClose])

  return <AnimatePresence>{isOpen && <>
    <motion.button type="button" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 z-50 bg-ink/25 backdrop-blur-sm lg:hidden" aria-label="Close mobile menu overlay" />
    <motion.aside id="mobile-navigation" role="dialog" aria-modal="true" initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 28, stiffness: 260 }} className="fixed inset-y-0 right-0 z-[60] flex h-dvh w-[min(92vw,380px)] flex-col bg-cream shadow-2xl lg:hidden" aria-label="Mobile navigation">
      <div className="flex shrink-0 items-center justify-between border-b border-gold/15 px-4 py-3 sm:px-5 sm:py-4"><Logo onClick={onClose} /><button type="button" onClick={onClose} className="icon-button" aria-label="Close menu"><FiX size={21} /></button></div>
      <div className="flex-1 overflow-y-auto overscroll-contain">
      {isAuthenticated && <div className="mx-4 mt-4 space-y-2 sm:mx-5 sm:mt-5"><Link to={user.role === 'admin' ? '/admin/dashboard' : '/profile'} onClick={onClose} className="flex min-w-0 items-center gap-3 rounded-2xl bg-pink-light p-4"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white text-rosewood"><FiUser /></span><span className="min-w-0"><strong className="block truncate text-sm">{user.firstName} {user.lastName}</strong><small className="block break-words text-muted">{user.role === 'admin' ? 'Open admin dashboard' : 'Open customer dashboard'}</small></span></Link></div>}
      <nav className="flex flex-col px-4 py-3 sm:px-5 sm:py-4">{primaryNavigation.map((item) => <NavLink key={item.to} to={item.to} onClick={onClose} className={({ isActive }) => `flex min-h-12 items-center border-b border-gold/10 py-3 text-sm font-medium ${isActive ? 'text-rosewood' : 'text-ink/75 hover:text-rosewood'}`}>{item.label}</NavLink>)}</nav>
      </div>
      <div className="safe-area-bottom shrink-0 border-t border-gold/15 bg-pink-light/50 p-4 sm:p-5"><div className="mb-3 grid grid-cols-2 gap-2 sm:mb-4 sm:gap-3"><Link to="/wishlist" onClick={onClose} className="secondary-button min-w-0 px-2 sm:px-3"><FiHeart /> Wishlist <span>{wishlistCount > 99 ? '99+' : wishlistCount}</span></Link><button type="button" className="secondary-button min-w-0 px-2 sm:px-3" onClick={onCart}><FiShoppingBag /> Cart <span>{cartCount > 99 ? '99+' : cartCount}</span></button></div>{isAuthenticated ? <button type="button" onClick={onLogout} className="primary-button w-full"><FiLogOut /> Logout</button> : <div className="grid grid-cols-2 gap-2 sm:gap-3"><Link to="/login" onClick={onClose} className="primary-button px-2 sm:px-3"><FiLogIn /> Login</Link><Link to="/register" onClick={onClose} className="secondary-button px-2 sm:px-3">Register</Link></div>}</div>
    </motion.aside>
  </>}</AnimatePresence>
}
export default MobileMenu
