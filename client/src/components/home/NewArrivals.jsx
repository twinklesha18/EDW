import { useSelector } from 'react-redux'
import SectionTitle from '../common/SectionTitle.jsx'
import ProductCard from '../product/ProductCard.jsx'

function NewArrivals() {
  const arrivals = useSelector((state) => state.catalog.products).filter((product) => product.isNew).slice(0, 5)

  return (
    <section className="section-shell py-16 sm:py-24">
      <SectionTitle align="left" eyebrow="Just arrived" title="New Arrivals" subtitle="Fresh ideas, thoughtfully finished and ready to inspire your next celebration." />
      <div className="-mx-5 mt-10 flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-5 min-[900px]:mx-0 min-[900px]:grid min-[900px]:grid-cols-3 min-[900px]:overflow-visible min-[900px]:px-0 xl:grid-cols-5">
        {arrivals.map((product) => <div key={product.id} className="w-[82vw] max-w-[330px] shrink-0 snap-center min-[900px]:w-auto min-[900px]:max-w-none"><ProductCard product={product} /></div>)}
        {!arrivals.length && <p className="w-full rounded-2xl bg-pink-light/40 p-8 text-center text-sm text-muted">New creations will appear here after they are added.</p>}
      </div>
    </section>
  )
}

export default NewArrivals
