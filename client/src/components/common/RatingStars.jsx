import { FiStar } from 'react-icons/fi'

function RatingStars({ rating, reviewCount, compact = false }) {
  const rounded = Math.round(rating)

  return (
    <div className="flex items-center gap-2" aria-label={`${rating} out of 5 stars`}>
      <span className="flex text-gold" aria-hidden="true">
        {Array.from({ length: 5 }, (_, index) => (
          <FiStar key={index} className={index < rounded ? 'fill-current' : 'opacity-30'} size={compact ? 13 : 16} />
        ))}
      </span>
      {reviewCount !== undefined && <span className="text-xs text-muted">({reviewCount})</span>}
    </div>
  )
}

export default RatingStars
