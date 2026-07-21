import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import { FiChevronDown, FiHeart, FiLogOut, FiMenu, FiSearch, FiShoppingBag, FiUser, FiX } from 'react-icons/fi'
import toast from 'react-hot-toast'
import { useDispatch, useSelector } from 'react-redux'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { primaryNavigation } from '../../data/navigation.js'
import { logoutUser } from '../../redux/slices/authSlice.js'
import { toggleCartDrawer } from '../../redux/slices/cartSlice.js'
import Logo from './Logo.jsx'
import MobileMenu from './MobileMenu.jsx'
import SearchBar from './SearchBar.jsx'

function Navbar() {
  const dispatch = useDispatch(), navigate = useNavigate()
  const { user, isAuthenticated } = useSelector((state) => state.auth)
  const cartCount = useSelector((state) => state.cart.itemCount), wishlistCount = useSelector((state) => state.wishlist.count)
  const [isScrolled, setIsScrolled] = useState(false), [isMenuOpen, setIsMenuOpen] = useState(false), [isSearchOpen, setIsSearchOpen] = useState(false), [accountOpen, setAccountOpen] = useState(false), [search, setSearch] = useState('')
  const accountRef = useRef(null)

  useEffect(() => { const onScroll = () => setIsScrolled(window.scrollY > 12); onScroll(); window.addEventListener('scroll', onScroll, { passive: true }); return () => window.removeEventListener('scroll', onScroll) }, [])
  useEffect(() => { const close = (event) => { if (event.key === 'Escape' || (event.type === 'mousedown' && !accountRef.current?.contains(event.target))) setAccountOpen(false) }; document.addEventListener('mousedown', close); document.addEventListener('keydown', close); return () => { document.removeEventListener('mousedown', close); document.removeEventListener('keydown', close) } }, [])
  const submitSearch = (event) => { event.preventDefault(); const query = search.trim(); navigate(query ? `/shop?search=${encodeURIComponent(query)}` : '/shop'); setIsSearchOpen(false) }
  const logout = async () => { try { await dispatch(logoutUser()).unwrap(); setAccountOpen(false); setIsMenuOpen(false); toast.success('You have been logged out.') } catch (error) { toast.error(error?.message || 'Unable to log out.') } }
  const closeAccount = () => setAccountOpen(false)

  return <header className={`sticky top-0 z-50 border-b transition-all duration-300 ${isScrolled ? 'border-gold/15 bg-white/90 shadow-[0_8px_30px_-20px_rgba(59,47,54,.45)] backdrop-blur-xl' : 'border-transparent bg-cream/90 backdrop-blur-md'}`}>
    <nav className="section-shell flex h-[4.75rem] items-center justify-between gap-4" aria-label="Main navigation">
      <Logo onClick={() => setIsMenuOpen(false)} />
      <div className="hidden items-center gap-5 lg:flex xl:gap-7">{primaryNavigation.map((item) => <NavLink key={item.to} to={item.to} end={item.to === '/'} className={({ isActive }) => `nav-link ${isActive ? 'nav-link-active' : ''}`}>{item.label}</NavLink>)}</div>
      <div className="flex items-center gap-1 sm:gap-2">
        <button type="button" onClick={() => setIsSearchOpen((value) => !value)} className="icon-button" aria-label="Search products" aria-expanded={isSearchOpen}>{isSearchOpen ? <FiX /> : <FiSearch />}</button>
        <Link to="/wishlist" className="icon-button hidden sm:grid" aria-label={`Wishlist, ${wishlistCount} items`}><FiHeart /><span className="count-badge">{wishlistCount > 99 ? '99+' : wishlistCount}</span></Link>
        <button type="button" onClick={() => dispatch(toggleCartDrawer(true))} className="icon-button hidden sm:grid" aria-label={`Cart, ${cartCount} items`}><FiShoppingBag /><span className="count-badge">{cartCount > 99 ? '99+' : cartCount}</span></button>
        {isAuthenticated ? <div ref={accountRef} className="relative hidden xl:block">
          <button type="button" onClick={() => setAccountOpen((value) => !value)} className="inline-flex min-h-10 items-center gap-2 rounded-full border border-gold/35 px-4 text-xs font-semibold hover:bg-pink-light" aria-haspopup="menu" aria-expanded={accountOpen}><FiUser /> {user.firstName}<FiChevronDown /></button>
          <AnimatePresence>{accountOpen && <motion.div role="menu" initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} className="absolute right-0 mt-2 w-52 rounded-2xl border border-gold/15 bg-white p-2 shadow-luxury">
            {user.role === 'admin' ? <Link role="menuitem" to="/admin/dashboard" onClick={closeAccount} className="block rounded-xl bg-ink px-4 py-3 text-sm text-white hover:bg-rosewood">Admin Dashboard</Link> : <><Link role="menuitem" to="/profile" onClick={closeAccount} className="block rounded-xl px-4 py-3 text-sm hover:bg-pink-light">Customer Dashboard</Link><Link role="menuitem" to="/profile/addresses" onClick={closeAccount} className="block rounded-xl px-4 py-3 text-sm hover:bg-pink-light">Addresses</Link><Link role="menuitem" to="/wishlist" onClick={closeAccount} className="block rounded-xl px-4 py-3 text-sm hover:bg-pink-light">Wishlist</Link></>}
            <button role="menuitem" type="button" onClick={logout} className="flex w-full items-center gap-2 rounded-xl px-4 py-3 text-left text-sm text-red-600 hover:bg-red-50"><FiLogOut /> Logout</button>
          </motion.div>}</AnimatePresence>
        </div> : <div className="hidden items-center gap-2 xl:flex"><Link to="/login" className="text-xs font-semibold hover:text-rosewood">Login</Link><Link to="/register" className="rounded-full border border-gold/35 px-4 py-2 text-xs font-semibold hover:bg-pink-light">Register</Link></div>}
        <button type="button" onClick={() => setIsMenuOpen(true)} className="icon-button lg:hidden" aria-label="Open menu" aria-expanded={isMenuOpen}><FiMenu size={21} /></button>
      </div>
    </nav>
    <AnimatePresence>{isSearchOpen && <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden border-t border-gold/10 bg-white"><div className="section-shell py-4"><SearchBar value={search} onChange={(e) => setSearch(e.target.value)} onSubmit={submitSearch} onClear={() => setSearch('')} autoFocus /></div></motion.div>}</AnimatePresence>
    <MobileMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} user={user} isAuthenticated={isAuthenticated} cartCount={cartCount} wishlistCount={wishlistCount} onCart={() => { setIsMenuOpen(false); dispatch(toggleCartDrawer(true)) }} onLogout={logout} />
  </header>
}
export default Navbar
