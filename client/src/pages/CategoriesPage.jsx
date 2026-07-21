import { useSelector } from 'react-redux'
import PageBanner from '../components/common/PageBanner.jsx'
import PageTransition from '../components/common/PageTransition.jsx'
import CategoryCard from '../components/home/CategoryCard.jsx'
import { useDocumentTitle } from '../hooks/useDocumentTitle.js'

function CategoriesPage() {
  const categories = useSelector((state) => state.catalog.categories)
  useDocumentTitle('Categories | Eshaz Dream World')

  return (
    <PageTransition>
      <PageBanner eyebrow="Collections" title="Explore Every Category" description="From sweet surprises to personalized keepsakes, discover the style that speaks to your occasion." />
      <section className="section-shell py-12 sm:py-16">
        <div className="grid grid-cols-1 justify-center gap-5 min-[520px]:grid-cols-2 lg:grid-cols-[repeat(auto-fit,minmax(260px,360px))] lg:gap-6">
          {categories.map((category) => <CategoryCard key={category.slug} category={category} />)}
        </div>
      </section>
    </PageTransition>
  )
}

export default CategoriesPage
