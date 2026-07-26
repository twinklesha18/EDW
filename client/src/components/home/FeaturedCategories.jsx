import { useSelector } from 'react-redux'
import { useResponsivePagination } from '../../hooks/useResponsivePagination.js'
import CarouselPagination from '../common/CarouselPagination.jsx'
import SectionTitle from '../common/SectionTitle.jsx'
import CategoryCard from './CategoryCard.jsx'

function FeaturedCategories() {
  const categories = useSelector((state) => state.catalog.categories).slice(0, 8)
  const { page, setPage, itemsPerPage, totalPages, visibleItems, previousPage, nextPage } = useResponsivePagination(categories)

  return (
    <section className="section-shell overflow-hidden py-16 sm:py-24">
      <div className="mx-auto flex justify-center">
        <SectionTitle eyebrow="Curated for you" title="Shop by Category" subtitle="Find the perfect creation for every beautiful occasion." />
      </div>

      {!categories.length ? (
        <p className="mt-10 rounded-2xl bg-pink-light/40 p-8 text-center text-sm text-muted">
          Collections will appear here after categories are published.
        </p>
      ) : (
        <>
          <div className="relative mt-10 min-w-0">
              <div
                key={`${page}-${itemsPerPage}`}
                className="carousel-enter grid grid-cols-1 justify-center gap-5 min-[520px]:grid-cols-2 lg:grid-cols-[repeat(3,minmax(0,320px))] lg:gap-6"
              >
                {visibleItems.map((category) => <CategoryCard key={category.slug} category={category} />)}
              </div>
          </div>

          <CarouselPagination page={page} totalPages={totalPages} onPage={setPage} onPrevious={previousPage} onNext={nextPage} label="categories" />
        </>
      )}
    </section>
  )
}

export default FeaturedCategories
