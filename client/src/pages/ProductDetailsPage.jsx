import { useCallback, useEffect, useMemo, useState } from 'react'
import { FiChevronRight, FiHeart, FiMinus, FiPackage, FiPlus, FiShare2, FiShoppingBag, FiTruck } from 'react-icons/fi'
import toast from 'react-hot-toast'
import { useDispatch, useSelector } from 'react-redux'
import { Link, useNavigate, useParams } from 'react-router-dom'
import EmptyState from '../components/common/EmptyState.jsx'
import PageTransition from '../components/common/PageTransition.jsx'
import RatingStars from '../components/common/RatingStars.jsx'
import ProductCard from '../components/product/ProductCard.jsx'
import { useSeo } from '../hooks/useSeo.js'
import { formatCurrency } from '../utils/formatCurrency.js'
import { addToCart } from '../redux/slices/cartSlice.js'
import { toggleWishlist } from '../redux/slices/wishlistSlice.js'
import { productToCartPayload, productToWishlistPayload } from '../utils/productAdapters.js'
import api, { getApiError } from '../services/api.js'
import { normalizeCatalogProduct } from '../utils/catalogAdapters.js'
import LoadingSkeleton from '../components/common/LoadingSkeleton.jsx'
import ProductReviews from '../components/product/ProductReviews.jsx'
import { brandLogo } from '../assets/images/index.js'
import { INDEX_ROBOTS, NO_INDEX_ROBOTS, SITE_URL, absoluteUrl } from '../utils/seo.js'

function ProductDetailsPage() {
  const { slug } = useParams()
  const catalogProducts = useSelector((state) => state.catalog.products)
  const [product, setProduct] = useState(null)
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [productError, setProductError] = useState('')
  const [selectedImage, setSelectedImage] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [selectedSize, setSelectedSize] = useState('S')
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated)
  const [customization, setCustomization] = useState({ message: '', preferredColor: '', notes: '' })
  const wishlisted = useSelector((state) => product ? state.wishlist.items.some((item) => item.productId === product.id) : false)
  const cartPending = useSelector((state) => product ? state.cart.pendingProductIds.includes(product.id) : false)
  const wishlistPending = useSelector((state) => product ? state.wishlist.pendingProductIds.includes(product.id) : false)
  const productSeo = useMemo(() => {
    if (!product) return {
      title: loading ? 'Gift Creation | Eshaz Dream World' : 'Product Not Found | Eshaz Dream World',
      description: loading ? 'Loading a custom gift creation from Eshaz Dream World.' : 'This Eshaz Dream World product could not be found.',
      canonicalPath: loading ? `/product/${slug}` : undefined,
      image: brandLogo,
      imageAlt: 'Eshaz Dream World logo',
      type: 'product',
      robots: loading ? INDEX_ROBOTS : NO_INDEX_ROBOTS,
    }

    const canonicalPath = `/product/${product.slug}`
    const reviewCount = reviews.length
    const ratingValue = reviewCount ? reviews.reduce((total, review) => total + Number(review.rating || 0), 0) / reviewCount : 0
    const offers = Object.entries(product.prices).map(([size, price]) => ({
      '@type': 'Offer',
      name: `Size ${size}`,
      url: absoluteUrl(canonicalPath),
      priceCurrency: 'LKR',
      price: Number(price).toFixed(2),
      availability: 'https://schema.org/InStock',
      itemCondition: 'https://schema.org/NewCondition',
    }))
    const productData = {
      '@type': 'Product',
      '@id': `${absoluteUrl(canonicalPath)}#product`,
      name: product.name,
      description: product.description,
      image: product.images.map(absoluteUrl),
      sku: product.id,
      category: product.categoryLabel,
      brand: { '@type': 'Brand', name: 'Eshaz Dream World' },
      offers,
      ...(reviewCount > 0 && {
        aggregateRating: {
          '@type': 'AggregateRating',
          ratingValue: Number(ratingValue.toFixed(1)),
          reviewCount,
        },
      }),
    }
    const breadcrumbData = {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_URL}/` },
        { '@type': 'ListItem', position: 2, name: 'Shop', item: `${SITE_URL}/shop` },
        { '@type': 'ListItem', position: 3, name: product.name, item: absoluteUrl(canonicalPath) },
      ],
    }

    const seoProductName = product.name.length > 42 ? `${product.name.slice(0, 39).trim()}...` : product.name
    return {
      title: `${seoProductName} | Eshaz Dream World`,
      description: product.description.length > 155 ? `${product.description.slice(0, 152).trim()}...` : product.description,
      canonicalPath,
      image: product.image,
      imageAlt: product.name,
      type: 'product',
      robots: INDEX_ROBOTS,
      structuredData: { '@context': 'https://schema.org', '@graph': [productData, breadcrumbData] },
    }
  }, [loading, product, reviews, slug])
  useSeo(productSeo)

  const loadProduct = useCallback(async () => { try { const response = await api.get(`/products/${slug}`); const normalized = normalizeCatalogProduct(response.data.data.product); setProduct(normalized); setReviews(response.data.data.reviews || []); setProductError('') } catch (error) { setProduct(null); setProductError(getApiError(error).message) } finally { setLoading(false) } }, [slug])

  useEffect(() => { setLoading(true); loadProduct() }, [loadProduct])

  useEffect(() => {
    setSelectedImage(product?.image)
    setQuantity(1)
    setSelectedSize('S')
    setCustomization({ message: '', preferredColor: '', notes: '' })
  }, [product])

  const related = useMemo(() => product ? catalogProducts.filter((item) => item.id !== product.id && item.category === product.category).slice(0, 4) : [], [catalogProducts, product])

  if (loading) return <LoadingSkeleton />

  if (!product) {
    return (
        <PageTransition><section className="section-shell py-24"><EmptyState title="Product not found" message={productError || 'This creation may have moved or is unavailable.'} action={<Link to="/shop" className="primary-button">Return to Shop</Link>} /></section></PageTransition>
    )
  }

  const shareProduct = async () => {
    const shareData = { title: product.name, text: product.description, url: window.location.href }
    try {
      if (navigator.share) await navigator.share(shareData)
      else { await navigator.clipboard.writeText(window.location.href); toast.success('Product link copied.') }
    } catch (error) {
      if (error.name !== 'AbortError') toast.error('Unable to share this product right now.')
    }
  }
  const addProduct = async () => { try { await dispatch(addToCart(productToCartPayload(product, selectedSize, quantity, customization))).unwrap(); toast.success(`Size ${selectedSize} added to your cart.`) } catch (error) { toast.error(error?.message || 'Unable to add this item.') } }
  const buyNow = async () => {
    try {
      await dispatch(addToCart(productToCartPayload(product, selectedSize, quantity, customization))).unwrap()
      if (isAuthenticated) navigate('/checkout')
      else navigate('/login', { state: { from: '/checkout' } })
    } catch (error) { toast.error(error?.message || 'Unable to start checkout.') }
  }
  const toggleSaved = async () => { try { await dispatch(toggleWishlist(productToWishlistPayload(product))).unwrap(); toast.success(wishlisted ? 'Removed from your wishlist.' : 'Added to your wishlist.') } catch (error) { toast.error(error?.message || 'Unable to update your wishlist.') } }

  return (
    <PageTransition>
      <section className="section-shell py-8 sm:py-12">
        <nav className="mb-8 flex flex-wrap items-center gap-2 text-xs text-muted" aria-label="Breadcrumb">
          <Link to="/" className="hover:text-rosewood">Home</Link><FiChevronRight aria-hidden="true" />
          <Link to="/shop" className="hover:text-rosewood">Shop</Link><FiChevronRight aria-hidden="true" />
          <span className="text-ink">{product.name}</span>
        </nav>

        <div className="grid gap-10 lg:grid-cols-2 lg:gap-14">
          <div>
            <div className="aspect-square overflow-hidden rounded-[2rem] bg-pink-light">
              <img src={selectedImage} alt={product.name} className="h-full w-full object-cover" />
            </div>
            <div className="mt-4 grid grid-cols-3 gap-3">
              {product.images.map((image, index) => (
                <button key={`${image}-${index}`} type="button" onClick={() => setSelectedImage(image)} className={`aspect-square overflow-hidden rounded-xl border-2 ${selectedImage === image ? 'border-rosewood' : 'border-transparent'}`} aria-label={`View product image ${index + 1}`}>
                  <img src={image} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          </div>

          <div className="lg:py-3">
            {product.badge && <span className="inline-flex rounded-full bg-pink-light px-3 py-1.5 text-[0.68rem] font-bold uppercase tracking-wider text-rosewood">{product.badge}</span>}
            <p className="mt-5 text-xs font-semibold uppercase tracking-[0.2em] text-gold">{product.categoryLabel}</p>
            <h1 className="mt-3 font-serif text-4xl font-semibold leading-tight text-ink sm:text-5xl">{product.name}</h1>
            <div className="mt-4"><RatingStars rating={product.rating} reviewCount={product.reviewCount} /></div>
            <div className="mt-6 flex flex-wrap items-end gap-3">
              <span className="font-serif text-3xl font-semibold text-rosewood">{formatCurrency(product.prices[selectedSize])}</span>
              {product.oldPrice && <span className="pb-1 text-sm text-muted line-through">{formatCurrency(product.oldPrice)}</span>}
              {product.discount > 0 && <span className="mb-1 rounded-full bg-pink-light px-2.5 py-1 text-xs font-semibold text-rosewood">Save {product.discount}%</span>}
            </div>
            <p className="mt-6 leading-7 text-muted">{product.description}</p>
            <fieldset className="mt-6">
              <legend className="form-label">Size</legend>
              <div className="mt-2 flex flex-wrap gap-3">
                {['S', 'M', 'L'].map((size) => <button key={size} type="button" onClick={() => setSelectedSize(size)} className={`min-w-24 rounded-full border px-5 py-3 text-sm font-semibold transition ${selectedSize === size ? 'border-rosewood bg-rosewood text-white' : 'border-gold/25 bg-white text-ink hover:border-rosewood'}`} aria-pressed={selectedSize === size}>{size} · {formatCurrency(product.prices[size])}</button>)}
              </div>
            </fieldset>

            <div className="mt-7 rounded-2xl bg-pink-light/45 p-5"><h2 className="font-serif text-xl font-semibold">Personalize this creation</h2><div className="mt-4 grid gap-4 sm:grid-cols-2"><label className="block"><span className="form-label">Custom message</span><input className="input-field" maxLength={250} value={customization.message} onChange={(e) => setCustomization((current) => ({ ...current, message: e.target.value }))} placeholder="A message for the recipient" /></label><label className="block"><span className="form-label">Preferred color</span><input className="input-field" maxLength={100} value={customization.preferredColor} onChange={(e) => setCustomization((current) => ({ ...current, preferredColor: e.target.value }))} placeholder="Blush pink, lavender…" /></label><label className="block sm:col-span-2"><span className="form-label">Special notes</span><textarea className="input-field min-h-24" maxLength={500} value={customization.notes} onChange={(e) => setCustomization((current) => ({ ...current, notes: e.target.value }))} placeholder="Any presentation details we should know" /></label></div></div>

            <div className="mt-7 flex flex-wrap items-center gap-3">
              <div className="flex h-12 items-center rounded-full border border-gold/25 bg-white" aria-label="Quantity selector">
                <button type="button" onClick={() => setQuantity((current) => Math.max(1, current - 1))} className="grid h-12 w-11 place-items-center" aria-label="Decrease quantity"><FiMinus aria-hidden="true" /></button>
                <span className="min-w-8 text-center text-sm font-semibold" aria-live="polite">{quantity}</span>
                <button type="button" onClick={() => setQuantity((current) => Math.min(99, current + 1))} className="grid h-12 w-11 place-items-center" aria-label="Increase quantity"><FiPlus aria-hidden="true" /></button>
              </div>
              <button type="button" onClick={addProduct} disabled={cartPending} className="primary-button flex-1"><FiShoppingBag aria-hidden="true" /> {cartPending ? 'Adding…' : 'Add to Cart'}</button>
              <button type="button" onClick={toggleSaved} disabled={wishlistPending} className={`icon-button h-12 w-12 border border-gold/25 ${wishlisted ? 'text-[#c94d7c]' : ''}`} aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'} aria-pressed={wishlisted}><FiHeart className={wishlisted ? 'fill-current' : ''} aria-hidden="true" /></button>
            </div>
            <button type="button" onClick={buyNow} disabled={cartPending} className="secondary-button mt-3 w-full">{cartPending ? 'Preparing Checkout…' : 'Buy Now'}</button>

            <div className="mt-7 grid gap-3 sm:grid-cols-2">
              <div className="flex gap-3 rounded-2xl bg-blue-light/45 p-4"><FiTruck className="mt-1 shrink-0 text-rosewood" aria-hidden="true" /><div><p className="text-sm font-semibold text-ink">Delivery information</p><p className="mt-1 text-xs leading-5 text-muted">Timing and charges will be confirmed with your order.</p></div></div>
              <div className="flex gap-3 rounded-2xl bg-pink-light p-4"><FiPackage className="mt-1 shrink-0 text-rosewood" aria-hidden="true" /><div><p className="text-sm font-semibold text-ink">Careful presentation</p><p className="mt-1 text-xs leading-5 text-muted">Designed and packed with attention to detail.</p></div></div>
            </div>

            <div className="mt-7 divide-y divide-gold/15 border-y border-gold/15">
              <details className="group py-4" open><summary className="cursor-pointer text-sm font-semibold text-ink">Product details</summary><p className="mt-3 text-sm leading-7 text-muted">{product.description}</p></details>
              <details className="group py-4"><summary className="cursor-pointer text-sm font-semibold text-ink">Customization information</summary><p className="mt-3 text-sm leading-7 text-muted">Colors, message, contents and presentation can be discussed through the custom order request.</p></details>
            </div>
            <button type="button" onClick={shareProduct} className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-rosewood"><FiShare2 aria-hidden="true" /> Share this creation</button>
          </div>
        </div>
      </section>

      <ProductReviews productId={product.id} reviews={reviews} onChanged={loadProduct} />

      <section className="border-t border-gold/10 bg-pink-light/30 py-16">
        <div className="section-shell">
          <h2 className="font-serif text-4xl font-semibold text-ink">You May Also Love</h2>
          <div className="mt-8 grid gap-5 min-[520px]:grid-cols-2 lg:grid-cols-4">{related.map((item) => <ProductCard key={item.id} product={item} />)}</div>
        </div>
      </section>
    </PageTransition>
  )
}

export default ProductDetailsPage
