import { FiCheck, FiEdit3, FiPackage, FiSearch } from 'react-icons/fi'
import { orderSteps } from '../../data/features.js'
import SectionTitle from '../common/SectionTitle.jsx'

const icons = { search: FiSearch, edit: FiEdit3, check: FiCheck, package: FiPackage }

function HowItWorks() {
  return (
    <section className="section-shell py-16 sm:py-24">
      <div className="mx-auto flex justify-center"><SectionTitle eyebrow="Simple and personal" title="How to Order" subtitle="Four thoughtful steps from your first idea to your special creation." /></div>
      <div className="relative mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="absolute left-[12%] right-[12%] top-8 hidden h-px bg-gold/25 lg:block" aria-hidden="true" />
        {orderSteps.map((step, index) => {
          const Icon = icons[step.icon]
          return (
            <article key={step.title} className="relative text-center">
              <span className="relative z-10 mx-auto grid h-16 w-16 place-items-center rounded-full border border-gold/30 bg-white text-rosewood shadow-sm"><Icon size={21} aria-hidden="true" /><span className="absolute -right-1 -top-1 grid h-6 w-6 place-items-center rounded-full bg-gold text-[0.65rem] font-bold text-white">{index + 1}</span></span>
              <h3 className="mt-5 font-serif text-xl font-semibold text-ink">{step.title}</h3>
              <p className="mx-auto mt-2 max-w-[240px] text-sm leading-6 text-muted">{step.description}</p>
            </article>
          )
        })}
      </div>
    </section>
  )
}

export default HowItWorks
