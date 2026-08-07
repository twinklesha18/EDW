import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { FiEye, FiHeart, FiShoppingBag } from 'react-icons/fi'
import toast from 'react-hot-toast'
import { useDispatch, useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import { formatCurrency } from '../../utils/formatCurrency.js'
import RatingStars from '../common/RatingStars.jsx'
import { toggleWishlist } from '../../redux/slices/wishlistSlice.js'
import { productToWishlistPayload } from '../../utils/productAdapters.js'
import { optimizedImageUrl, responsiveImageProps } from '../../utils/imageUrl.js'

function ProductCard({ product, view = 'grid', autoRotateImages = false }) {
  const cardRef = useRef(null)
  const dispatch = useDispatch()
  const isWishlisted = useSelector((state) => state.wishlist.items.some((item) => item.productId === product.id))
  const wishlistPending = useSelector((state) => state.wishlist.pendingProductIds.includes(product.id))
  const isList = view === 'list'
  const prefersReducedMotion = useReducedMotion()
  const images = useMemo(() => {
    const candidates = Array.isArray(product.images) && product.images.length ? product.images : [product.image]
    return [...new Set(candidates.filter(Boolean))].slice(0, 3)
  }, [product.image, product.images])
  const [activeImage, setActiveImage] = useState(0)
  const [failedImages, setFailedImages] = useState([])
  const [isCardVisible, setIsCardVisible] = useState(false)
  const [isPageVisible, setIsPageVisible] = useState(() => document.visibilityState === 'visible')
  const imageSignature = images.join('|')

  useEffect(() => { setActiveImage(0); setFailedImages([]) }, [imageSignature, product.id])
  useEffect(() => {
    if (!autoRotateImages) return undefined
    const card = cardRef.current
    if (!card || !('IntersectionObserver' in window)) {
      setIsCardVisible(true)
      return undefined
    }
    const observer = new IntersectionObserver(([entry]) => setIsCardVisible(entry.isIntersecting), { rootMargin: '120px 0px', threshold: 0.01 })
    observer.observe(card)
    return () => observer.disconnect()
  }, [autoRotateImages])
  useEffect(() => {
    if (!autoRotateImages) return undefined
    const handleVisibilityChange = () => setIsPageVisible(document.visibilityState === 'visible')
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [autoRotateImages])
  useEffect(() => {
    const availableIndexes = images.map((_, index) => index).filter((index) => !failedImages.includes(images[index]))
    if (!autoRotateImages || !isCardVisible || !isPageVisible || availableIndexes.length < 2 || prefersReducedMotion) return undefined
    const timer = window.setInterval(() => setActiveImage((current) => {
      const position = availableIndexes.indexOf(current)
      return availableIndexes[(position + 1) % availableIndexes.length]
    }), 3000)
    return () => window.clearInterval(timer)
  }, [autoRotateImages, failedImages, images, isCardVisible, isPageVisible, prefersReducedMotion])
  useEffect(() => {
    if (!autoRotateImages || !isCardVisible || !isPageVisible || images.length < 2) return
    const nextIndex = (activeImage + 1) % images.length
    const preloader = new window.Image()
    preloader.src = optimizedImageUrl(images[nextIndex], 720)
  }, [activeImage, autoRotateImages, images, isCardVisible, isPageVisible])

  const handleImageError = (event) => {
    const failedUrl = images[activeImage]
    const nextFailedImages = [...new Set([...failedImages, failedUrl])]
    const nextIndex = images.findIndex((image, index) => index !== activeImage && !nextFailedImages.includes(image))
    setFailedImages(nextFailedImages)
    if (nextIndex >= 0) setActiveImage(nextIndex)
    else event.currentTarget.style.visibility = 'hidden'
  }

  const handleWishlist = async () => { try { await dispatch(toggleWishlist(productToWishlistPayload(product))).unwrap(); toast.success(isWishlisted ? 'Removed from your wishlist.' : 'Added to your wishlist.') } catch (error) { toast.error(error?.message || 'Unable to update your wishlist.') } }

  return (
    <article
      ref={cardRef}
      className={`group overflow-hidden rounded-[1.75rem] border border-gold/15 bg-white shadow-[0_14px_45px_-30px_rgba(59,47,54,0.45)] transition-all duration-300 hover:-translate-y-1 hover:shadow-luxury ${isList ? 'sm:grid sm:grid-cols-[240px_1fr]' : 'flex h-full flex-col'}`}
    >
      <div className={`relative overflow-hidden bg-pink-light ${isList ? 'min-h-64' : 'aspect-square'}`}>
        <Link to={`/product/${product.slug}`} aria-label={`View ${product.name}`} className="block h-full w-full">
          <AnimatePresence initial={false} mode="popLayout">
            <motion.img
              key={`${product.id}-${activeImage}-${images[activeImage]}`}
              {...responsiveImageProps(images[activeImage] || product.image, [360, 540, 720, 900, 1080, 1440])}
              sizes={isList ? '(min-width: 640px) 240px, 100vw' : '(min-width: 1400px) 400px, (min-width: 900px) 31vw, 82vw'}
              alt={images.length > 1 ? `${product.name} – image ${activeImage + 1} of ${images.length}` : product.name}
              width="1440"
              height="1440"
              loading="lazy"
              decoding="async"
              onError={handleImageError}
              initial={prefersReducedMotion ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={prefersReducedMotion ? undefined : { opacity: 0 }}
              transition={{ duration: prefersReducedMotion ? 0 : 0.45, ease: 'easeOut' }}
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
          </AnimatePresence>
        </Link>
        {product.badge && <span className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1.5 text-[0.65rem] font-bold uppercase tracking-wider text-rosewood shadow-sm backdrop-blur-sm">{product.badge}</span>}
        <button
          type="button"
          onClick={handleWishlist}
          disabled={wishlistPending}
          className={`absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-full bg-white/90 shadow-sm transition-colors ${isWishlisted ? 'text-[#c94d7c]' : 'text-ink hover:text-[#c94d7c]'}`}
          aria-label={isWishlisted ? `Remove ${product.name} from wishlist` : `Add ${product.name} to wishlist`}
          aria-pressed={isWishlisted}
        >
          <FiHeart className={isWishlisted ? 'fill-current' : ''} aria-hidden="true" />
        </button>
        {images.length > 1 && (
          <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5 rounded-full bg-white/85 px-2.5 py-2 shadow-sm backdrop-blur-sm" aria-label={`${product.name} image selector`}>
            {images.map((image, index) => !failedImages.includes(image) && (
              <button
                key={image}
                type="button"
                onClick={() => setActiveImage(index)}
                className={`h-2 rounded-full transition-all ${activeImage === index ? 'w-5 bg-rosewood' : 'w-2 bg-ink/30 hover:bg-rosewood/60'}`}
                aria-label={`Show image ${index + 1} of ${images.length}`}
                aria-current={activeImage === index ? 'true' : undefined}
              />
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-gold">{product.categoryLabel}</p>
        <Link to={`/product/${product.slug}`} className="mt-2 font-serif text-xl font-semibold leading-snug text-ink transition-colors hover:text-rosewood">
          {product.name}
        </Link>
        <div className="mt-3"><RatingStars rating={product.rating} reviewCount={product.reviewCount} compact /></div>
        {isList && <p className="mt-4 text-sm leading-7 text-muted">{product.description}</p>}

        <div className="mt-auto pt-5">
          <div className="flex flex-wrap items-end gap-x-2 gap-y-1">
            <span className="font-serif text-xl font-semibold text-rosewood">From {formatCurrency(product.prices.S)}</span>
            {product.oldPrice && <span className="text-xs text-muted line-through">{formatCurrency(product.oldPrice)}</span>}
            {product.discount > 0 && <span className="ml-auto rounded-full bg-pink-light px-2 py-1 text-[0.65rem] font-semibold text-rosewood">-{product.discount}%</span>}
          </div>
          <div className="mt-5 grid grid-cols-[1fr_auto] gap-2">
            <Link to={`/product/${product.slug}`} className="primary-button min-w-0 px-4"><FiShoppingBag aria-hidden="true" /> Choose Size</Link>
            <Link to={`/product/${product.slug}`} className="icon-button border border-gold/25" aria-label={`Quick view ${product.name}`}>
              <FiEye aria-hidden="true" />
            </Link>
          </div>
        </div>
      </div>
    </article>
  )
}

export default ProductCard
