import { FiChevronLeft, FiChevronRight } from 'react-icons/fi'

function CarouselPagination({ page, totalPages, onPage, onPrevious, onNext, label }) {
  if (totalPages <= 1) return null

  return (
    <nav className="mt-8 flex items-center justify-center gap-4" aria-label={`${label} pages`}>
      <button type="button" onClick={onPrevious} className="icon-button h-12 w-12 border border-gold/25 bg-white shadow-sm" aria-label={`Previous ${label}`}>
        <FiChevronLeft size={19} />
      </button>
      <div className="flex items-center gap-2">
        {Array.from({ length: totalPages }, (_, index) => (
          <button
            key={index}
            type="button"
            onClick={() => onPage(index)}
            className={`h-2.5 rounded-full transition-all ${index === page ? 'w-8 bg-rosewood' : 'w-2.5 bg-gold/30 hover:bg-gold'}`}
            aria-label={`Show ${label} page ${index + 1}`}
            aria-current={index === page ? 'page' : undefined}
          />
        ))}
      </div>
      <button type="button" onClick={onNext} className="icon-button h-12 w-12 border border-gold/25 bg-white shadow-sm" aria-label={`Next ${label}`}>
        <FiChevronRight size={19} />
      </button>
      <span className="sr-only" aria-live="polite">Page {page + 1} of {totalPages}</span>
    </nav>
  )
}

export default CarouselPagination
