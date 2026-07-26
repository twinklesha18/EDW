import { useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import { useResponsivePagination } from '../../hooks/useResponsivePagination.js'
import CarouselPagination from '../common/CarouselPagination.jsx'
import SectionTitle from '../common/SectionTitle.jsx'
import ProductCard from '../product/ProductCard.jsx'

function FeaturedProducts() {
  const products = useSelector((state) => state.catalog.products).slice(0, 8)
  const { page, setPage, itemsPerPage, totalPages, visibleItems, previousPage, nextPage } = useResponsivePagination(products)

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
          <>
            <div className="relative mt-10 min-w-0">
                <div
                  key={`${page}-${itemsPerPage}`}
                  className="carousel-enter grid grid-cols-1 gap-5 min-[520px]:grid-cols-2 lg:grid-cols-3"
                >
                  {visibleItems.map((product) => <ProductCard key={product.id} product={product} />)}
                </div>
            </div>

            <CarouselPagination page={page} totalPages={totalPages} onPage={setPage} onPrevious={previousPage} onNext={nextPage} label="featured products" />
          </>
        )}
      </div>
    </section>
  )
}

export default FeaturedProducts
