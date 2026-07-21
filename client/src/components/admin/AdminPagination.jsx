import { FiChevronLeft, FiChevronRight } from 'react-icons/fi'

function AdminPagination({ pagination, onPage }) {
  if (!pagination || pagination.pages <= 1) return null

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gold/10 px-3 py-4 text-xs text-muted sm:px-4">
      <span>Page {pagination.page} of {pagination.pages} · {pagination.total} records</span>
      <div className="flex shrink-0 gap-2">
        <button type="button" className="icon-button border border-gold/20 disabled:cursor-not-allowed disabled:opacity-40" disabled={!pagination.hasPreviousPage} onClick={() => onPage(pagination.page - 1)} aria-label="Previous page">
          <FiChevronLeft />
        </button>
        <button type="button" className="icon-button border border-gold/20 disabled:cursor-not-allowed disabled:opacity-40" disabled={!pagination.hasNextPage} onClick={() => onPage(pagination.page + 1)} aria-label="Next page">
          <FiChevronRight />
        </button>
      </div>
    </div>
  )
}

export default AdminPagination
