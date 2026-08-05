import { useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import SectionTitle from '../common/SectionTitle.jsx'
import ProductCard from '../product/ProductCard.jsx'

function FeaturedProducts() {
  const products = useSelector((state) => state.catalog.products).slice(0, 8)

  return (
    <section className="overflow-hidden bg-gradient-to-b from-white to-pink-light/40 py-16 sm:py-24">
      <div className="section-shell">
        <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
          <SectionTitle align="left" eyebrow="Signature picks" title="Featured Creations" subtitle="Handpicked gifts made to make every moment memorable." />
          <Link to="/shop" className="secondary-button shrink-0">View All Creations</Link>
        </div>

        {!products.length ? (
          <p className="mt-10 rounded-2xl bg-white p-8 text-center text-sm text-muted">
            Creations will appear here when products are added.
          </p>
        ) : (
          <div className="-mx-5 mt-10 flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-5 min-[900px]:mx-0 min-[900px]:px-0">
            {products.map((product) => <div key={product.id} className="w-[82vw] max-w-[330px] shrink-0 snap-center min-[900px]:w-[calc(33.333%_-_.667rem)] min-[900px]:max-w-none"><ProductCard product={product} autoRotateImages /></div>)}
          </div>
        )}
      </div>
    </section>
  )
}

export default FeaturedProducts
