import RatingStars from '../common/RatingStars.jsx'

function TestimonialCard({ testimonial }) {
  return (
    <article className="rounded-[1.75rem] border border-gold/15 bg-white p-7 shadow-[0_14px_40px_-32px_rgba(59,47,54,0.45)]">
      <div className="flex items-center justify-between gap-4">
        <span className="grid h-12 w-12 place-items-center rounded-full bg-pink-light font-serif text-lg font-semibold text-rosewood">{testimonial.initials}</span>
        <RatingStars rating={testimonial.rating} compact />
      </div>
      <blockquote className="mt-6 font-serif text-xl leading-8 text-ink">“{testimonial.review}”</blockquote>
      <div className="mt-6 border-t border-gold/10 pt-4">
        <p className="text-sm font-semibold text-ink">{testimonial.name}</p>
        <p className="mt-1 text-xs text-muted">{testimonial.ordered}</p>
      </div>
    </article>
  )
}

export default TestimonialCard
