import { FiHeart, FiStar, FiTarget } from 'react-icons/fi'
import { Link } from 'react-router-dom'
import { brandLogo } from '../assets/images/index.js'
import PageBanner from '../components/common/PageBanner.jsx'
import PageTransition from '../components/common/PageTransition.jsx'
import { galleryImages } from '../data/gallery.js'
import { useDocumentTitle } from '../hooks/useDocumentTitle.js'

function AboutPage() {
  useDocumentTitle('About | Eshaz Dream World')

  return (
    <PageTransition>
      <PageBanner eyebrow="Our Story" title="Creativity with Heart" description="A dream world where meaningful ideas become beautiful, personal creations." />
      <section className="section-shell grid items-center gap-10 py-16 lg:grid-cols-2 lg:gap-16">
        <div className="relative mx-auto max-w-md"><div className="absolute inset-5 -z-10 rounded-full bg-gradient-to-br from-pink-primary/40 to-lavender/60 blur-2xl" /><img src={brandLogo} alt="Eshaz Dream World logo" className="w-full rounded-full object-contain" /></div>
        <div>
          <span className="text-xs font-semibold uppercase tracking-[0.25em] text-gold">Welcome to our world</span>
          <h2 className="mt-4 font-serif text-4xl font-semibold text-ink sm:text-5xl">Meaningful ideas, beautifully made</h2>
          <p className="mt-6 leading-8 text-muted">Welcome to Eshaz Dream World, where meaningful ideas are transformed into beautiful creations. Every bouquet and gift is designed with care to make your special moments more memorable.</p>
          <p className="mt-4 leading-8 text-muted">Our work begins by listening—to the colors you love, the story behind the gift, and the feeling you want it to carry. That personal connection guides every thoughtful detail.</p>
        </div>
      </section>

      <section className="bg-blue-light/35 py-16 sm:py-20"><div className="section-shell grid gap-5 md:grid-cols-3">
        {[
          { Icon: FiTarget, title: 'Our Mission', text: 'To create thoughtful, beautiful and personalized gifts that bring happiness to every celebration.' },
          { Icon: FiStar, title: 'Our Vision', text: 'To become a trusted creative gift destination known for quality, love and unique customization.' },
          { Icon: FiHeart, title: 'Our Values', text: 'Creativity, care, thoughtful personalization and honest attention to every meaningful detail.' },
        ].map(({ Icon, title, text }) => <article key={title} className="rounded-[1.75rem] border border-gold/15 bg-white p-7"><span className="grid h-12 w-12 place-items-center rounded-full bg-pink-light text-rosewood"><Icon aria-hidden="true" /></span><h2 className="mt-5 font-serif text-2xl font-semibold text-ink">{title}</h2><p className="mt-3 text-sm leading-7 text-muted">{text}</p></article>)}
      </div></section>

      <section className="section-shell py-16 sm:py-20">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {galleryImages.slice(0, 4).map((item, index) => <img key={item.id} src={item.image} alt={item.alt} loading="lazy" className={`h-full w-full rounded-2xl object-cover ${index % 2 ? 'mt-6' : ''}`} />)}
        </div>
        <div className="mt-16 rounded-[2rem] border border-gold/20 bg-gradient-to-r from-pink-light to-lavender/45 p-8 text-center sm:p-12"><h2 className="font-serif text-4xl font-semibold text-ink">Let us create your next special moment</h2><p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-muted">Explore ready inspiration or tell us about the gift you have been imagining.</p><div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row"><Link to="/shop" className="primary-button">Explore the Shop</Link><Link to="/custom-orders" className="secondary-button">Start a Custom Order</Link></div></div>
      </section>
    </PageTransition>
  )
}

export default AboutPage
