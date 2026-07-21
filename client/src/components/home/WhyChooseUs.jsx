import { FiGift, FiHeart } from 'react-icons/fi'
import { GiMagicBroom, GiRibbonMedal } from 'react-icons/gi'
import { features } from '../../data/features.js'
import SectionTitle from '../common/SectionTitle.jsx'
import FeatureCard from './FeatureCard.jsx'

const icons = { heart: FiHeart, hands: GiRibbonMedal, magic: GiMagicBroom, gift: FiGift }

function WhyChooseUs() {
  return (
    <section className="bg-blue-light/35 py-16 sm:py-24">
      <div className="section-shell">
        <div className="mx-auto flex justify-center"><SectionTitle eyebrow="The Eshaz difference" title="Why Choose Eshaz Dream World?" subtitle="Personal attention, thoughtful presentation and meaningful details in every creation." /></div>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => <FeatureCard key={feature.title} icon={icons[feature.icon]} title={feature.title} description={feature.description} />)}
        </div>
      </div>
    </section>
  )
}

export default WhyChooseUs
