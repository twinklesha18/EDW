import { useEffect, useMemo, useState } from 'react'
import { FiGrid, FiList, FiSliders, FiX } from 'react-icons/fi'
import { useSelector } from 'react-redux'
import { useDocumentTitle } from '../hooks/useDocumentTitle.js'
import { useSearchParams } from 'react-router-dom'
import EmptyState from '../components/common/EmptyState.jsx'
import PageBanner from '../components/common/PageBanner.jsx'
import PageTransition from '../components/common/PageTransition.jsx'
import SearchBar from '../components/layout/SearchBar.jsx'
import ProductGrid from '../components/product/ProductGrid.jsx'

const pageSize = 6

function ShopPage() {
  useDocumentTitle('Shop | Eshaz Dream World')
  const [searchParams, setSearchParams] = useSearchParams()
  const [searchInput, setSearchInput] = useState(searchParams.get('search') || '')
  const [view, setView] = useState('grid')
  const [filtersOpen, setFiltersOpen] = useState(false)
  const products = useSelector((state) => state.catalog.products)
  const categories = useSelector((state) => state.catalog.categories)
  const catalogLoading = useSelector((state) => state.catalog.isLoading)
  const catalogError = useSelector((state) => state.catalog.error)

  const search = searchParams.get('search') || ''
  const category = searchParams.get('category') || 'all'
  const availableMax = Math.ceil(Math.max(15000, ...products.map((product) => product.price)) / 500) * 500
  const maxPrice = Number(searchParams.get('maxPrice') || availableMax)
  const sort = searchParams.get('sort') || 'newest'
  const page = Math.max(1, Number(searchParams.get('page') || 1))

  useEffect(() => setSearchInput(search), [search])

  const setParam = (key, value, defaultValue) => {
    const next = new URLSearchParams(searchParams)
    if (value === defaultValue || value === '' || value === 0) next.delete(key)
    else next.set(key, String(value))
    if (key !== 'page') next.delete('page')
    setSearchParams(next)
  }

  const filteredProducts = useMemo(() => {
    const normalizedSearch = search.toLowerCase().trim()
    const filtered = products.filter((product) => {
      const matchesSearch = !normalizedSearch || `${product.name} ${product.categoryLabel} ${product.description}`.toLowerCase().includes(normalizedSearch)
      return matchesSearch && (category === 'all' || product.category === category) && product.price <= maxPrice
    })

    return [...filtered].sort((first, second) => {
      if (sort === 'newest') return Number(second.isNew) - Number(first.isNew)
      if (sort === 'price-low') return first.price - second.price
      if (sort === 'price-high') return second.price - first.price
      return 0
    })
  }, [products, search, category, maxPrice, sort])

  const pageCount = Math.max(1, Math.ceil(filteredProducts.length / pageSize))
  const safePage = Math.min(page, pageCount)
  const visibleProducts = filteredProducts.slice((safePage - 1) * pageSize, safePage * pageSize)
  const resetFilters = () => { setSearchInput(''); setSearchParams({}) }

  const filterPanel = (
    <div className="space-y-7">
      <div>
        <label htmlFor="shop-category" className="filter-label">Category</label>
        <select id="shop-category" value={category} onChange={(event) => setParam('category', event.target.value, 'all')} className="input-field mt-2">
          <option value="all">All categories</option>
          {categories.map((item) => <option key={item.slug} value={item.slug}>{item.name}</option>)}
        </select>
      </div>
      <div>
        <div className="flex justify-between gap-3"><label htmlFor="price-range" className="filter-label">Maximum price</label><span className="text-xs text-rosewood">LKR {maxPrice.toLocaleString()}</span></div>
        <input id="price-range" type="range" min="0" max={availableMax} step="500" value={maxPrice} onChange={(event) => setParam('maxPrice', Number(event.target.value), availableMax)} className="mt-4 w-full accent-[#c26a8b]" />
      </div>
      <button type="button" onClick={resetFilters} className="secondary-button w-full">Clear Filters</button>
    </div>
  )

  return (
    <PageTransition>
      <PageBanner eyebrow="Shop" title="Find Your Perfect Creation" description="Browse thoughtful gifts and filter the collection to match your moment." />
      <section className="section-shell py-12 sm:py-16">
        <div className="grid gap-8 lg:grid-cols-[260px_1fr]">
          <aside className="hidden h-fit rounded-[1.75rem] border border-gold/15 bg-white p-6 lg:block">
            <h2 className="font-serif text-2xl font-semibold text-ink">Filters</h2><div className="mt-6">{filterPanel}</div>
          </aside>

          <div className="min-w-0">
            <SearchBar id="shop-search" value={searchInput} onChange={(event) => setSearchInput(event.target.value)} onSubmit={(event) => { event.preventDefault(); setParam('search', searchInput.trim(), '') }} onClear={() => { setSearchInput(''); setParam('search', '', '') }} placeholder="Search by name, category or detail…" />
            <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-muted"><span className="font-semibold text-ink">{filteredProducts.length}</span> {filteredProducts.length === 1 ? 'creation' : 'creations'} found</p>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => setFiltersOpen(true)} className="secondary-button px-4 lg:hidden"><FiSliders aria-hidden="true" /> Filters</button>
                <label className="sr-only" htmlFor="sort-products">Sort products</label>
                <select id="sort-products" value={sort} onChange={(event) => setParam('sort', event.target.value, 'newest')} className="min-h-10 rounded-full border border-gold/25 bg-white px-3 text-xs text-ink">
                  <option value="newest">Newest</option><option value="price-low">Price: Low to High</option><option value="price-high">Price: High to Low</option>
                </select>
                <div className="hidden rounded-full border border-gold/20 bg-white p-1 sm:flex">
                  <button type="button" onClick={() => setView('grid')} className={`grid h-8 w-8 place-items-center rounded-full ${view === 'grid' ? 'bg-pink-light text-rosewood' : 'text-muted'}`} aria-label="Grid view"><FiGrid aria-hidden="true" /></button>
                  <button type="button" onClick={() => setView('list')} className={`grid h-8 w-8 place-items-center rounded-full ${view === 'list' ? 'bg-pink-light text-rosewood' : 'text-muted'}`} aria-label="List view"><FiList aria-hidden="true" /></button>
                </div>
              </div>
            </div>

            <div className="mt-7">
              {catalogLoading ? <p className="rounded-2xl bg-pink-light/40 p-10 text-center text-sm text-muted">Loading the latest creations…</p> : catalogError ? <EmptyState title="Catalog unavailable" message={catalogError.message || 'Unable to load products right now.'} /> : visibleProducts.length ? <ProductGrid products={visibleProducts} view={view} /> : <EmptyState title="No creations match your search" message="Try a different keyword, category, or price range." action={<button type="button" onClick={resetFilters} className="primary-button">Reset filters</button>} />}
            </div>

            {pageCount > 1 && (
              <nav className="mt-10 flex justify-center gap-2" aria-label="Product pages">
                {Array.from({ length: pageCount }, (_, index) => index + 1).map((pageNumber) => (
                  <button key={pageNumber} type="button" onClick={() => setParam('page', pageNumber, 1)} className={`grid h-10 w-10 place-items-center rounded-full text-sm font-semibold ${pageNumber === safePage ? 'bg-ink text-white' : 'border border-gold/25 bg-white text-ink'}`} aria-current={pageNumber === safePage ? 'page' : undefined}>{pageNumber}</button>
                ))}
              </nav>
            )}
          </div>
        </div>
      </section>

      {filtersOpen && (
        <div className="fixed inset-0 z-[70] lg:hidden">
          <button type="button" className="absolute inset-0 bg-ink/30 backdrop-blur-sm" onClick={() => setFiltersOpen(false)} aria-label="Close filters" />
          <aside className="absolute inset-y-0 right-0 w-[min(88vw,360px)] overflow-y-auto bg-cream p-6 shadow-2xl">
            <div className="flex items-center justify-between"><h2 className="font-serif text-2xl font-semibold">Filters</h2><button type="button" onClick={() => setFiltersOpen(false)} className="icon-button" aria-label="Close filters"><FiX aria-hidden="true" /></button></div>
            <div className="mt-7">{filterPanel}</div>
          </aside>
        </div>
      )}
    </PageTransition>
  )
}

export default ShopPage
