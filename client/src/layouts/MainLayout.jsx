import { lazy, Suspense, useEffect } from 'react'
import { useSelector } from 'react-redux'
import { Outlet, useLocation } from 'react-router-dom'
import BackToTop from '../components/common/BackToTop.jsx'
import WhatsAppButton from '../components/common/WhatsAppButton.jsx'
import Footer from '../components/layout/Footer.jsx'
import Navbar from '../components/layout/Navbar.jsx'

const CartDrawer = lazy(() => import('../components/cart/CartDrawer.jsx'))

function DeferredCartDrawer() {
  const isCartOpen = useSelector((state) => state.cart.isCartOpen)
  return isCartOpen ? <Suspense fallback={null}><CartDrawer /></Suspense> : null
}

function MainLayout() {
  const { pathname } = useLocation()
  const isDashboardPage = /^\/(?:admin|profile)(?:\/|$)/i.test(pathname)
    || /^\/orders?\/EDW-\d{4}-\d{6}\/?$/i.test(pathname)

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
  }, [pathname])

  return (
    <div className="flex min-h-screen flex-col overflow-x-clip">
      <Navbar />
      <main className="flex-1 pt-[4.75rem]"><Outlet /></main>
      {!isDashboardPage && <Footer />}
      <DeferredCartDrawer />
      <BackToTop />
      <WhatsAppButton />
    </div>
  )
}

export default MainLayout
