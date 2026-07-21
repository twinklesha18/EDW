import { FiArrowUpRight } from 'react-icons/fi'
import { Link } from 'react-router-dom'

function CategoryCard({ category }) {
  const designLabel = category.count > 0
    ? `${category.count} ${category.count === 1 ? 'design' : 'designs'}`
    : 'New collection'

  return (
    <article className="group min-w-0 overflow-hidden rounded-[2rem] border border-gold/15 bg-white p-2.5 shadow-[0_18px_55px_-38px_rgba(59,47,54,0.55)] transition-all duration-500 hover:-translate-y-1.5 hover:border-gold/35 hover:shadow-luxury">
      <Link to={`/shop?category=${category.slug}`} className="block min-w-0" aria-label={`Explore ${category.name}`}>
        <div className="relative aspect-square overflow-hidden rounded-[1.55rem] bg-gradient-to-br from-pink-light to-blue-light">
          <img
            src={category.image}
            alt={category.name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.035]"
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink/10 via-transparent to-white/5" />
          <span className="absolute right-3 top-3 rounded-full border border-white/60 bg-white/85 px-3 py-1.5 text-[.62rem] font-semibold uppercase tracking-wider text-rosewood shadow-sm backdrop-blur-md">
            {designLabel}
          </span>
        </div>

        <div className="flex min-w-0 items-center gap-4 px-3 pb-3 pt-4 sm:px-4 sm:pb-4">
          <div className="min-w-0 flex-1">
            <h3 className="truncate font-serif text-2xl font-semibold text-ink">{category.name}</h3>
            <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted">
              {category.description || 'Discover thoughtful creations made for your special moments.'}
            </p>
            <span className="mt-3 inline-block text-[.65rem] font-bold uppercase tracking-[.18em] text-rosewood">
              Explore collection
            </span>
          </div>
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-gold/25 bg-cream text-rosewood transition-all duration-300 group-hover:rotate-12 group-hover:border-rosewood group-hover:bg-rosewood group-hover:text-white">
            <FiArrowUpRight aria-hidden="true" />
          </span>
        </div>
      </Link>
    </article>
  )
}

export default CategoryCard
