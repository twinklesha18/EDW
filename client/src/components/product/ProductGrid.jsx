import ProductCard from './ProductCard.jsx'

function ProductGrid({ products, view = 'grid' }) {
  return (
    <div className={view === 'list' ? 'grid gap-5' : 'grid gap-5 min-[520px]:grid-cols-2 xl:grid-cols-3'}>
      {products.map((product) => <ProductCard key={product.id} product={product} view={view} />)}
    </div>
  )
}

export default ProductGrid
