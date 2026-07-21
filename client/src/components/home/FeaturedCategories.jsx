import { AnimatePresence, motion } from 'framer-motion'
import { useSelector } from 'react-redux'
import { useResponsivePagination } from '../../hooks/useResponsivePagination.js'
import CarouselPagination from '../common/CarouselPagination.jsx'
import SectionTitle from '../common/SectionTitle.jsx'
import CategoryCard from './CategoryCard.jsx'

function FeaturedCategories() {
  const categories = useSelector((state) => state.catalog.categories).slice(0, 8)
  const { page, setPage, itemsPerPage, totalPages, visibleItems, previousPage, nextPage, changeFromSwipe } = useResponsivePagination(categories)

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
            <AnimatePresence initial={false} mode="wait">
              <motion.div
                key={`${page}-${itemsPerPage}`}
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                transition={{ duration: 0.28, ease: 'easeOut' }}
                drag={totalPages > 1 ? 'x' : false}
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.12}
                onDragEnd={changeFromSwipe}
                className="grid cursor-grab grid-cols-1 justify-center gap-5 active:cursor-grabbing min-[520px]:grid-cols-2 lg:grid-cols-[repeat(3,minmax(0,320px))] lg:gap-6"
              >
                {visibleItems.map((category) => <CategoryCard key={category.slug} category={category} />)}
              </motion.div>
            </AnimatePresence>
          </div>

          <CarouselPagination page={page} totalPages={totalPages} onPage={setPage} onPrevious={previousPage} onNext={nextPage} label="categories" />
        </>
      )}
    </section>
  )
}

export default FeaturedCategories
