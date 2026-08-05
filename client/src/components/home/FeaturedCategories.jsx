import { useSelector } from 'react-redux'
import SectionTitle from '../common/SectionTitle.jsx'
import CategoryCard from './CategoryCard.jsx'

function FeaturedCategories() {
  const categories = useSelector((state) => state.catalog.categories).slice(0, 8)

  return (
    <section className="section-shell overflow-hidden py-16 sm:py-24">
      <div className="mx-auto flex justify-center">
        <SectionTitle eyebrow="Curated for you" title="Shop by Category" subtitle="Browse personalized bouquets, gift hampers and unique gift ideas for birthdays, anniversaries and every celebration." />
      </div>

      {!categories.length ? (
        <p className="mt-10 rounded-2xl bg-pink-light/40 p-8 text-center text-sm text-muted">
          Collections will appear here after categories are published.
        </p>
      ) : (
        <div className="-mx-5 mt-10 flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-5 min-[900px]:mx-0 min-[900px]:px-0">
          {categories.map((category) => <div key={category.slug} className="w-[82vw] max-w-[330px] shrink-0 snap-center min-[900px]:w-[calc(33.333%_-_.667rem)] min-[900px]:max-w-none"><CategoryCard category={category} /></div>)}
        </div>
      )}
    </section>
  )
}

export default FeaturedCategories
