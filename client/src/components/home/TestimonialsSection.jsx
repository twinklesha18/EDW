import { testimonials } from '../../data/testimonials.js'
import SectionTitle from '../common/SectionTitle.jsx'
import TestimonialCard from './TestimonialCard.jsx'

function TestimonialsSection() {
  return (
    <section className="bg-pink-light/45 py-16 sm:py-24">
      <div className="section-shell">
        <div className="mx-auto flex justify-center"><SectionTitle eyebrow="Kind words" title="Loved by Our Customers" subtitle="Sample feedback is shown for layout preview and can be replaced with real customer reviews later." /></div>
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {testimonials.map((testimonial) => <TestimonialCard key={testimonial.id} testimonial={testimonial} />)}
        </div>
      </div>
    </section>
  )
}

export default TestimonialsSection
