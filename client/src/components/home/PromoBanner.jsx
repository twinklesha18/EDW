import { GiButterfly } from 'react-icons/gi'
import { FiArrowRight } from 'react-icons/fi'
import { Link } from 'react-router-dom'
import { productImages } from '../../assets/images/index.js'
import { useSelector } from 'react-redux'
import { responsiveImageProps } from '../../utils/imageUrl.js'

function PromoBanner() {
  const banner = useSelector((state) => state.catalog.banners.find((item) => item.position === 'promotional'))
  const catalogLoaded = useSelector((state) => state.catalog.loaded)
  const promoImage = banner?.image?.url || (catalogLoaded ? productImages.pictureBouquet : '')
  return (
    <section className="section-shell py-8 sm:py-12">
      <div className="relative isolate grid overflow-hidden rounded-[2.25rem] border border-gold/30 bg-gradient-to-br from-lavender/55 via-pink-light to-blue-light lg:grid-cols-[1.1fr_0.9fr]">
        <div className="fine-grid absolute inset-0 -z-10 opacity-30" />
        <div className="flex flex-col justify-center px-6 py-12 text-center sm:px-10 lg:px-14 lg:text-left">
          <GiButterfly className="mx-auto text-3xl text-rosewood/50 lg:mx-0" aria-hidden="true" />
          <h2 className="mt-4 font-serif text-4xl font-semibold text-ink sm:text-5xl">Create Something Truly Yours</h2>
          <p className="mt-5 max-w-xl text-sm leading-7 text-muted">Share your idea, preferred colors, budget and special message. We will turn it into a beautiful customized creation.</p>
          <Link to="/custom-orders" className="primary-button mt-7 self-center px-7 lg:self-start">Start a Custom Order <FiArrowRight aria-hidden="true" /></Link>
        </div>
        <div className="min-h-80 overflow-hidden lg:min-h-[450px]">
          {promoImage ? <img {...responsiveImageProps(promoImage, [480, 720, 960, 1200])} sizes="(min-width: 1024px) 45vw, 100vw" alt={banner?.title || 'Customized pastel picture bouquet'} width="1200" height="900" loading="lazy" decoding="async" className="h-full w-full object-cover" /> : <div className="h-full min-h-80 animate-pulse bg-gradient-to-br from-pink-light via-white to-blue-light" aria-hidden="true" />}
        </div>
      </div>
    </section>
  )
}

export default PromoBanner
