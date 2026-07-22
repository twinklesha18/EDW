import { FiArrowLeft } from 'react-icons/fi'
import { Link } from 'react-router-dom'
import { brandLogo } from '../assets/images/index.js'
import PageTransition from '../components/common/PageTransition.jsx'

function NotFoundPage() {
  return (
    <PageTransition>
      <section className="section-shell grid min-h-[70vh] place-items-center py-20 text-center">
        <div>
          <img src={brandLogo} alt="Eshaz Dream World logo" className="mx-auto h-28 w-28 rounded-full object-contain" />
          <p className="mt-5 font-serif text-7xl font-semibold text-pink-primary sm:text-8xl">404</p>
          <h1 className="mt-2 font-serif text-4xl font-semibold text-ink sm:text-5xl">This page drifted away</h1>
          <p className="mx-auto mt-5 max-w-md leading-7 text-muted">The page you are looking for does not exist or may have moved.</p>
          <Link to="/" className="primary-button mt-8"><FiArrowLeft aria-hidden="true" /> Back to Home</Link>
        </div>
      </section>
    </PageTransition>
  )
}

export default NotFoundPage
