import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import { FiChevronDown, FiHeart, FiLogOut, FiMenu, FiSearch, FiShoppingBag, FiUser, FiX } from 'react-icons/fi'
import toast from 'react-hot-toast'
import { useDispatch, useSelector } from 'react-redux'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { primaryNavigation } from '../../data/navigation.js'
import { logoutUser } from '../../redux/slices/authSlice.js'
import { toggleCartDrawer } from '../../redux/slices/cartSlice.js'
import Logo from './Logo.jsx'
import MobileMenu from './MobileMenu.jsx'
import SearchBar from './SearchBar.jsx'

function Navbar() {
  const dispatch = useDispatch(), navigate = useNavigate(), location = useLocation()
  const { user, isAuthenticated } = useSelector((state) => state.auth)
  const cartCount = useSelector((state) => state.cart.itemCount), wishlistCount = useSelector((state) => state.wishlist.count)
  const [isScrolled, setIsScrolled] = useState(false), [isMenuOpen, setIsMenuOpen] = useState(false), [isSearchOpen, setIsSearchOpen] = useState(false), [accountOpen, setAccountOpen] = useState(false), [search, setSearch] = useState('')
  const accountRef = useRef(null)

  useEffect(() => { const onScroll = () => setIsScrolled(window.scrollY > 12); onScroll(); window.addEventListener('scroll', onScroll, { passive: true }); return () => window.removeEventListener('scroll', onScroll) }, [])
  useEffect(() => { const close = (event) => { if (event.key === 'Escape' || (event.type === 'mousedown' && !accountRef.current?.contains(event.target))) setAccountOpen(false) }; document.addEventListener('mousedown', close); document.addEventListener('keydown', close); return () => { document.removeEventListener('mousedown', close); document.removeEventListener('keydown', close) } }, [])
  useEffect(() => { setIsMenuOpen(false); setIsSearchOpen(false); setAccountOpen(false) }, [location.pathname, location.search])
  const submitSearch = (event) => { event.preventDefault(); const query = search.trim(); navigate(query ? `/shop?search=${encodeURIComponent(query)}` : '/shop'); setIsSearchOpen(false) }
  const logout = async () => { try { await dispatch(logoutUser()).unwrap(); setAccountOpen(false); setIsMenuOpen(false); toast.success('You have been logged out.') } catch (error) { toast.error(error?.message || 'Unable to log out.') } }
  const closeAccount = () => setAccountOpen(false)

  return <header className={`sticky top-0 z-50 border-b transition-all duration-300 ${isScrolled ? 'border-gold/15 bg-white/90 shadow-[0_8px_30px_-20px_rgba(59,47,54,.45)] backdrop-blur-xl' : 'border-transparent bg-cream/90 backdrop-blur-md'}`}>
    <nav className="section-shell flex h-[4.75rem] items-center justify-between gap-4" aria-label="Main navigation">
      <Logo onClick={() => setIsMenuOpen(false)} />
      <div className="hidden items-center gap-3 lg:flex xl:gap-6">{primaryNavigation.map((item) => <NavLink key={item.to} to={item.to} end={item.to === '/'} className={({ isActive }) => `nav-link whitespace-nowrap ${isActive ? 'nav-link-active' : ''}`}>{item.label}</NavLink>)}</div>
      <div className="flex items-center gap-1 sm:gap-2">
        <button type="button" onClick={() => { setAccountOpen(false); setIsSearchOpen((value) => !value) }} className="icon-button" aria-label="Search products" aria-controls="navbar-search" aria-expanded={isSearchOpen}>{isSearchOpen ? <FiX /> : <FiSearch />}</button>
        <Link to="/wishlist" className="icon-button hidden sm:grid" aria-label={`Wishlist, ${wishlistCount} items`}><FiHeart />{wishlistCount > 0 && <span className="count-badge">{wishlistCount > 99 ? '99+' : wishlistCount}</span>}</Link>
        <button type="button" onClick={() => { setAccountOpen(false); setIsSearchOpen(false); dispatch(toggleCartDrawer(true)) }} className="icon-button hidden sm:grid" aria-label={`Cart, ${cartCount} items`}><FiShoppingBag />{cartCount > 0 && <span className="count-badge">{cartCount > 99 ? '99+' : cartCount}</span>}</button>
        {isAuthenticated ? <div ref={accountRef} className="relative hidden lg:block">
          <button type="button" onClick={() => { setIsSearchOpen(false); setAccountOpen((value) => !value) }} className="inline-flex min-h-10 items-center gap-2 rounded-full border border-gold/35 px-3 text-xs font-semibold transition-colors hover:bg-pink-light xl:px-4" aria-label={`Open account menu for ${user.firstName}`} aria-haspopup="menu" aria-expanded={accountOpen}><FiUser /><span className="hidden xl:inline">{user.firstName}</span><FiChevronDown className="hidden xl:block" /></button>
          <AnimatePresence>{accountOpen && <motion.div role="menu" initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} className="absolute right-0 z-20 mt-2 w-56 rounded-2xl border border-gold/15 bg-white p-2 shadow-luxury">
            {user.role === 'admin' ? <Link role="menuitem" to="/admin/dashboard" onClick={closeAccount} className="block rounded-xl bg-ink px-4 py-3 text-sm text-white hover:bg-rosewood">Admin Dashboard</Link> : <><Link role="menuitem" to="/profile" onClick={closeAccount} className="block rounded-xl px-4 py-3 text-sm hover:bg-pink-light">Customer Dashboard</Link><Link role="menuitem" to="/profile/addresses" onClick={closeAccount} className="block rounded-xl px-4 py-3 text-sm hover:bg-pink-light">Addresses</Link><Link role="menuitem" to="/wishlist" onClick={closeAccount} className="block rounded-xl px-4 py-3 text-sm hover:bg-pink-light">Wishlist</Link></>}
            <button role="menuitem" type="button" onClick={logout} className="flex w-full items-center gap-2 rounded-xl px-4 py-3 text-left text-sm text-red-600 hover:bg-red-50"><FiLogOut /> Logout</button>
          </motion.div>}</AnimatePresence>
        </div> : <div className="hidden items-center gap-1 lg:flex xl:gap-2"><Link to="/login" className="rounded-full px-2 py-2 text-xs font-semibold hover:text-rosewood xl:px-3">Login</Link><Link to="/register" className="inline-flex rounded-full border border-gold/35 px-3 py-2 text-xs font-semibold hover:bg-pink-light xl:px-4">Register</Link></div>}
        <button type="button" onClick={() => { setIsSearchOpen(false); setAccountOpen(false); setIsMenuOpen(true) }} className="icon-button lg:hidden" aria-label="Open menu" aria-controls="mobile-navigation" aria-expanded={isMenuOpen}><FiMenu size={21} /></button>
      </div>
    </nav>
    <AnimatePresence>{isSearchOpen && <motion.div id="navbar-search" initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden border-t border-gold/10 bg-white"><div className="section-shell py-4"><SearchBar value={search} onChange={(e) => setSearch(e.target.value)} onSubmit={submitSearch} onClear={() => setSearch('')} autoFocus /></div></motion.div>}</AnimatePresence>
    <MobileMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} user={user} isAuthenticated={isAuthenticated} cartCount={cartCount} wishlistCount={wishlistCount} onCart={() => { setIsMenuOpen(false); dispatch(toggleCartDrawer(true)) }} onLogout={logout} />
  </header>
}
export default Navbar
