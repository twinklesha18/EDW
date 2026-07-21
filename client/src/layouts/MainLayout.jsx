import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import BackToTop from '../components/common/BackToTop.jsx'
import WhatsAppButton from '../components/common/WhatsAppButton.jsx'
import Footer from '../components/layout/Footer.jsx'
import Navbar from '../components/layout/Navbar.jsx'
import CartDrawer from '../components/cart/CartDrawer.jsx'

function MainLayout() {
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
  }, [pathname])

  return (
    <div className="flex min-h-screen flex-col overflow-x-clip">
      <Navbar />
      <main className="flex-1"><Outlet /></main>
      <Footer />
      <CartDrawer />
      <BackToTop />
      <WhatsAppButton />
    </div>
  )
}

export default MainLayout
