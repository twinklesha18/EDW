import { useMemo } from 'react'
import { useSelector } from 'react-redux'
import PageBanner from '../components/common/PageBanner.jsx'
import PageTransition from '../components/common/PageTransition.jsx'
import CategoryCard from '../components/home/CategoryCard.jsx'
import { brandLogo } from '../assets/images/index.js'
import { useSeo } from '../hooks/useSeo.js'
import { INDEX_ROBOTS, SITE_URL, absoluteUrl } from '../utils/seo.js'

function CategoriesPage() {
  const categories = useSelector((state) => state.catalog.categories)
  const structuredData = useMemo(() => ({
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'CollectionPage',
        '@id': `${SITE_URL}/categories#collection`,
        url: `${SITE_URL}/categories`,
        name: 'Gift and Bouquet Categories | Eshaz Dream World',
        description: 'Browse custom bouquet and personalized gift categories for birthdays and special occasions in Sri Lanka.',
        isPartOf: { '@id': `${SITE_URL}/#website` },
        inLanguage: 'en-LK',
        mainEntity: {
          '@type': 'ItemList',
          numberOfItems: categories.length,
          itemListElement: categories.map((category, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            url: absoluteUrl(`/category/${category.slug}`),
            name: category.name,
            image: category.image ? absoluteUrl(category.image) : undefined,
          })),
        },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_URL}/` },
          { '@type': 'ListItem', position: 2, name: 'Categories', item: `${SITE_URL}/categories` },
        ],
      },
    ],
  }), [categories])
  useSeo({
    title: 'Gift & Bouquet Categories in Sri Lanka | Eshaz Dream World',
    description: 'Explore custom bouquet and personalized gift categories for birthdays, celebrations and meaningful moments across Sri Lanka.',
    canonicalPath: '/categories',
    image: categories[0]?.image || brandLogo,
    imageAlt: 'Eshaz Dream World gift and bouquet categories',
    robots: INDEX_ROBOTS,
    structuredData,
  })

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
