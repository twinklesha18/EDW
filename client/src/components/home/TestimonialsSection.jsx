import { useEffect, useState } from 'react'
import api from '../../services/api.js'
import SectionTitle from '../common/SectionTitle.jsx'
import TestimonialCard from './TestimonialCard.jsx'

const initials = (user) => `${user?.firstName?.[0] || ''}${user?.lastName?.[0] || ''}`.toUpperCase() || 'EDW'

function TestimonialsSection() {
  const [reviews, setReviews] = useState([])

  useEffect(() => {
    let active = true
    api.get('/reviews/homepage').then((response) => {
      if (!active) return
      setReviews(response.data.data.reviews.map((review) => ({
        id: review.id || review._id,
        name: `${review.user?.firstName || 'Customer'} ${review.user?.lastName || ''}`.trim(),
        initials: initials(review.user),
        rating: review.rating,
        review: review.comment,
        ordered: review.product?.name || 'Eshaz Dream World creation',
      })))
    }).catch(() => { if (active) setReviews([]) })
    return () => { active = false }
  }, [])

  return (
    <section className="bg-pink-light/45 py-16 sm:py-24">
      <div className="section-shell">
        <div className="mx-auto flex justify-center"><SectionTitle eyebrow="Kind words" title="Loved by Our Customers" subtitle="Real feedback from customers after their orders have been delivered." /></div>
        {reviews.length ? <div className="mt-10 grid gap-5 md:grid-cols-3">{reviews.map((review) => <TestimonialCard key={review.id} testimonial={review} />)}</div> : <p className="mx-auto mt-10 max-w-xl rounded-2xl border border-gold/15 bg-white/70 p-7 text-center text-sm text-muted">Approved customer reviews will appear here.</p>}
      </div>
    </section>
  )
}

export default TestimonialsSection
