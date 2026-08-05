import { useMemo } from 'react'
import { FiChevronRight } from 'react-icons/fi'
import { useSelector } from 'react-redux'
import { Link, useParams } from 'react-router-dom'
import EmptyState from '../components/common/EmptyState.jsx'
import LoadingSkeleton from '../components/common/LoadingSkeleton.jsx'
import PageBanner from '../components/common/PageBanner.jsx'
import PageTransition from '../components/common/PageTransition.jsx'
import ProductGrid from '../components/product/ProductGrid.jsx'
import { brandLogo } from '../assets/images/index.js'
import { useSeo } from '../hooks/useSeo.js'
import { INDEX_ROBOTS, NO_INDEX_ROBOTS, SITE_URL, absoluteUrl } from '../utils/seo.js'
import { categorySeoKeywords } from '../utils/seoKeywords.js'

function CategoryDetailsPage() {
  const { slug } = useParams()
  const categories = useSelector((state) => state.catalog.categories)
  const products = useSelector((state) => state.catalog.products)
  const catalogLoaded = useSelector((state) => state.catalog.loaded)
  const catalogLoading = useSelector((state) => state.catalog.isLoading)
  const catalogError = useSelector((state) => state.catalog.error)
  const category = categories.find((item) => item.slug === slug)
  const categoryProducts = useMemo(
    () => products.filter((product) => product.category === slug),
    [products, slug],
  )

  const description = category?.description?.trim()
    || `Explore ${category?.name || 'custom gift'} creations from Eshaz Dream World, thoughtfully made for birthdays and special occasions in Sri Lanka.`

  const seo = useMemo(() => {
    if (!category) {
      return {
        title: catalogLoaded ? 'Gift Category Not Found | Eshaz Dream World' : 'Gift Collection | Eshaz Dream World',
        description: catalogLoaded
          ? 'The requested Eshaz Dream World gift category could not be found.'
          : 'Explore custom gift and bouquet collections from Eshaz Dream World in Sri Lanka.',
        canonicalPath: catalogLoaded ? undefined : `/category/${slug}`,
        image: brandLogo,
        imageAlt: 'Eshaz Dream World logo',
        robots: catalogLoaded ? NO_INDEX_ROBOTS : INDEX_ROBOTS,
      }
    }

    const canonicalPath = `/category/${category.slug}`
    const categoryUrl = absoluteUrl(canonicalPath)
    const searchDescription = `Shop ${category.name.toLowerCase()} in Batticaloa from Eshaz Dream World. Personalized gifts for special occasions, with delivery across Sri Lanka.`
    const itemList = {
      '@type': 'ItemList',
      name: `${category.name} products`,
      numberOfItems: categoryProducts.length,
      itemListElement: categoryProducts.map((product, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        url: absoluteUrl(`/product/${product.slug}`),
        name: product.name,
        image: absoluteUrl(product.image),
      })),
    }
    const collectionPage = {
      '@type': 'CollectionPage',
      '@id': `${categoryUrl}#collection`,
      url: categoryUrl,
      name: `${category.name} | Eshaz Dream World`,
      description: searchDescription,
      isPartOf: { '@id': `${SITE_URL}/#website` },
      about: { '@type': 'Thing', name: category.name },
      primaryImageOfPage: category.image ? absoluteUrl(category.image) : undefined,
      mainEntity: itemList,
      inLanguage: 'en-LK',
    }
    const breadcrumb = {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_URL}/` },
        { '@type': 'ListItem', position: 2, name: 'Categories', item: `${SITE_URL}/categories` },
        { '@type': 'ListItem', position: 3, name: category.name, item: categoryUrl },
      ],
    }

    return {
      title: `${category.name} in Batticaloa | Eshaz Dream World`,
      description: searchDescription,
      keywords: categorySeoKeywords(category.name),
      canonicalPath,
      image: category.image || brandLogo,
      imageAlt: `${category.name} collection from Eshaz Dream World`,
      robots: INDEX_ROBOTS,
      structuredData: { '@context': 'https://schema.org', '@graph': [collectionPage, breadcrumb] },
    }
  }, [catalogLoaded, category, categoryProducts, slug])
  useSeo(seo)

  if (catalogLoading && !catalogLoaded) return <LoadingSkeleton />

  if (!category) {
    return (
      <PageTransition>
        <section className="section-shell py-24">
          <EmptyState
            title={catalogError ? 'Categories unavailable' : 'Category not found'}
            message={catalogError?.message || 'This collection may have moved or is no longer available.'}
            action={<Link to="/categories" className="primary-button">Browse Categories</Link>}
          />
        </section>
      </PageTransition>
    )
  }

  return (
    <PageTransition>
      <PageBanner eyebrow="Gift Collection" title={category.name} description={description} />
      <section className="section-shell py-10 sm:py-14">
        <nav className="mb-8 flex flex-wrap items-center gap-2 text-xs text-muted" aria-label="Breadcrumb">
          <Link to="/" className="hover:text-rosewood">Home</Link><FiChevronRight aria-hidden="true" />
          <Link to="/categories" className="hover:text-rosewood">Categories</Link><FiChevronRight aria-hidden="true" />
          <span className="text-ink">{category.name}</span>
        </nav>

        <div className="mb-8 max-w-3xl">
          <p className="text-sm leading-7 text-muted">
            Browse {categoryProducts.length} {categoryProducts.length === 1 ? 'creation' : 'creations'} in our {category.name} collection.
            Each product is available in sizes S, M, and L with clear pricing. Order online from Eshaz Dream World in Batticaloa for delivery across Sri Lanka.
          </p>
        </div>

        {categoryProducts.length ? (
          <ProductGrid products={categoryProducts} />
        ) : (
          <EmptyState
            title="New creations are coming"
            message={`There are no published products in ${category.name} yet.`}
            action={<Link to="/shop" className="primary-button">Explore All Products</Link>}
          />
        )}
      </section>
    </PageTransition>
  )
}

export default CategoryDetailsPage
