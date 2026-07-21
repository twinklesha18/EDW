import { motion } from 'framer-motion'
import { FiEye, FiHeart, FiShoppingBag } from 'react-icons/fi'
import toast from 'react-hot-toast'
import { useDispatch, useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import { formatCurrency } from '../../utils/formatCurrency.js'
import RatingStars from '../common/RatingStars.jsx'
import { toggleWishlist } from '../../redux/slices/wishlistSlice.js'
import { productToWishlistPayload } from '../../utils/productAdapters.js'

function ProductCard({ product, view = 'grid' }) {
  const dispatch = useDispatch()
  const isWishlisted = useSelector((state) => state.wishlist.items.some((item) => item.productId === product.id))
  const wishlistPending = useSelector((state) => state.wishlist.pendingProductIds.includes(product.id))
  const isList = view === 'list'

  const handleWishlist = async () => { try { await dispatch(toggleWishlist(productToWishlistPayload(product))).unwrap(); toast.success(isWishlisted ? 'Removed from your wishlist.' : 'Added to your wishlist.') } catch (error) { toast.error(error?.message || 'Unable to update your wishlist.') } }

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      className={`group overflow-hidden rounded-[1.75rem] border border-gold/15 bg-white shadow-[0_14px_45px_-30px_rgba(59,47,54,0.45)] transition-all duration-300 hover:-translate-y-1 hover:shadow-luxury ${isList ? 'sm:grid sm:grid-cols-[240px_1fr]' : 'flex h-full flex-col'}`}
    >
      <div className={`relative overflow-hidden bg-pink-light ${isList ? 'min-h-64' : 'aspect-square'}`}>
        <Link to={`/product/${product.slug}`} aria-label={`View ${product.name}`}>
          <img src={product.image} alt={product.name} loading="lazy" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
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
    </motion.article>
  )
}

export default ProductCard
