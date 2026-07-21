import { FiSearch, FiX } from 'react-icons/fi'

function SearchBar({ id = 'site-search', value, onChange, onSubmit, onClear, placeholder = 'Search creations…', autoFocus = false }) {
  return (
    <form onSubmit={onSubmit} className="relative w-full" role="search">
      <FiSearch className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted" aria-hidden="true" />
      <label className="sr-only" htmlFor={id}>Search products</label>
      <input
        id={id}
        type="search"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoFocus={autoFocus}
        className="input-field pl-11 pr-12"
      />
      {value && (
        <button
          type="button"
          onClick={onClear}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-muted transition-colors hover:text-ink"
          aria-label="Clear search"
        >
          <FiX aria-hidden="true" />
        </button>
      )}
    </form>
  )
}

export default SearchBar
