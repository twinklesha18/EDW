import { FiAward, FiGift, FiHeart, FiStar } from 'react-icons/fi'
import { GiBigDiamondRing, GiButterfly, GiCakeSlice, GiFlowerPot } from 'react-icons/gi'
import { Link } from 'react-router-dom'
import { occasions } from '../../data/occasions.js'
import SectionTitle from '../common/SectionTitle.jsx'

const icons = { cake: GiCakeSlice, ring: GiBigDiamondRing, heart: FiHeart, sparkle: GiButterfly, gift: FiGift, award: FiAward, flower: GiFlowerPot, star: FiStar }

function OccasionsSection() {
  return (
    <section className="section-shell py-16 sm:py-24">
      <div className="mx-auto flex justify-center"><SectionTitle eyebrow="Celebrate beautifully" title="Made for Every Special Moment" subtitle="Thoughtful creations designed around the people and milestones you cherish." /></div>
      <div className="mt-10 grid gap-4 min-[480px]:grid-cols-2 lg:grid-cols-4">
        {occasions.map((occasion, index) => {
          const Icon = icons[occasion.icon]
          return (
            <article key={occasion.name} className={`rounded-[1.75rem] border border-gold/15 p-6 ${index % 3 === 0 ? 'bg-pink-light' : index % 3 === 1 ? 'bg-lavender/40' : 'bg-blue-light/65'}`}>
              <span className="grid h-11 w-11 place-items-center rounded-full bg-white/80 text-rosewood"><Icon aria-hidden="true" /></span>
              <h3 className="mt-5 font-serif text-xl font-semibold text-ink">{occasion.name}</h3>
              <p className="mt-2 text-sm leading-6 text-muted">{occasion.line}</p>
              <Link to={`/shop?occasion=${encodeURIComponent(occasion.name)}`} className="mt-4 inline-flex text-xs font-semibold uppercase tracking-wider text-rosewood">Explore</Link>
            </article>
          )
        })}
      </div>
    </section>
  )
}

export default OccasionsSection
