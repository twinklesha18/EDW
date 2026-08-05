import { GiButterfly } from 'react-icons/gi'
import { FiArrowRight, FiHeart } from 'react-icons/fi'
import { Link } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { brandLogo, heroFallbackImage } from '../../assets/images/index.js'
import { useBrand } from '../../hooks/useBrand.js'
import { optimizedImageUrl, responsiveImageProps } from '../../utils/imageUrl.js'

function HeroSection() {
  const { tagline, logo } = useBrand()
  const banner = useSelector((state) => state.catalog.banners.find((item) => item.position === 'hero'))
  const heroImage = banner?.image?.url || heroFallbackImage

  return (
    <section className="relative isolate overflow-hidden bg-gradient-to-br from-cream via-pink-light/65 to-blue-light/80">
      <div className="fine-grid absolute inset-0 -z-20 opacity-35" />
      <div className="absolute -left-32 top-12 -z-10 h-96 w-96 rounded-full bg-pink-primary/25 blur-3xl" />
      <div className="absolute -right-28 bottom-0 -z-10 h-96 w-96 rounded-full bg-lavender/45 blur-3xl" />
      <GiButterfly className="absolute left-[8%] top-24 hidden rotate-[-18deg] text-3xl text-rosewood/30 sm:block" aria-hidden="true" />
      <GiButterfly className="absolute right-[7%] top-32 text-2xl text-gold/50" aria-hidden="true" />

      <div className="section-shell grid min-h-[calc(100svh-4.75rem)] items-center gap-10 py-14 lg:grid-cols-[1.05fr_0.95fr] lg:py-20">
        <div className="hero-copy-enter text-center lg:text-left">
          <div className="flex items-center justify-center gap-3 lg:justify-start">
            <span className="h-px w-8 bg-gold" />
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.28em] text-rosewood">Welcome to Eshaz Dream World</p>
          </div>
          <h1 className="mt-6 font-serif text-4xl font-semibold leading-[1.03] tracking-[-0.03em] text-ink min-[380px]:text-5xl sm:text-6xl xl:text-7xl">
            Turning Your Ideas into <span className="text-rosewood">Beautiful Creations</span>
          </h1>
          <p className="mt-5 font-serif text-xl italic text-gold sm:text-2xl">{tagline}</p>
          <p className="mx-auto mt-5 max-w-xl text-sm leading-7 text-muted sm:text-base lg:mx-0">Discover beautifully customized bouquets, thoughtful gifts and creative designs made with love for every special moment.</p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row lg:justify-start">
            <Link to="/shop" className="primary-button px-7">Shop Now <FiArrowRight aria-hidden="true" /></Link>
            <Link to="/categories" className="secondary-button px-7">Explore Collections</Link>
          </div>
          <div className="mt-8 flex items-start justify-center gap-3 text-center text-xs leading-5 text-muted lg:justify-start lg:text-left">
            <FiHeart className="text-rosewood" aria-hidden="true" /> Customized bouquets, gifts and creative designs
          </div>
        </div>

        <div className="hero-art-enter relative mx-auto w-full max-w-xl">
          <div className="hero-float relative mx-auto aspect-square max-w-[520px] overflow-hidden rounded-[45%_55%_48%_52%/48%_46%_54%_52%] border-4 border-white bg-white shadow-[0_30px_80px_-30px_rgba(112,59,80,0.45)]">
            {heroImage ? (
              <img
                {...responsiveImageProps(heroImage, [480, 720, 1080, 1440, 1920])}
                sizes="(min-width: 1024px) 45vw, 90vw"
                alt={banner?.title || 'Pastel customized gift hamper'}
                width="1920"
                height="1920"
                decoding="async"
                className="h-full w-full object-cover"
                fetchPriority="high"
              />
            ) : <div className="h-full w-full animate-pulse bg-gradient-to-br from-pink-light via-white to-blue-light" aria-hidden="true" />}
          </div>
          <div className="absolute -bottom-5 left-1/2 w-[38%] -translate-x-1/2 rounded-full border border-gold/25 bg-white/90 p-2 shadow-luxury backdrop-blur">
            <img src={optimizedImageUrl(logo?.url || brandLogo, 256)} alt="Eshaz Dream World logo" width="256" height="256" decoding="async" className="mx-auto aspect-square w-full rounded-full object-contain" />
          </div>
          <span className="absolute -left-3 top-[18%] h-20 w-20 rounded-full border border-gold/35 sm:-left-8" aria-hidden="true" />
          <span className="absolute -right-2 bottom-[18%] h-12 w-12 rounded-full bg-pink-primary/50 blur-sm" aria-hidden="true" />
        </div>
      </div>
    </section>
  )
}

export default HeroSection
