import { FiSearch, FiX } from 'react-icons/fi'

function SearchBar({ id = 'site-search', value, onChange, onSubmit, onClear, placeholder = 'Search creations…', autoFocus = false }) {
  return (
    <form onSubmit={onSubmit} className="relative w-full" role="search">
      <button
        type="submit"
        className="absolute left-1.5 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full text-muted transition-colors hover:bg-pink-light hover:text-rosewood focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rosewood"
        aria-label={value?.trim() ? `Search for ${value.trim()}` : 'View all products'}
      >
        <FiSearch aria-hidden="true" />
      </button>
      <label className="sr-only" htmlFor={id}>Search products</label>
      <input
        id={id}
        type="search"
        name="search"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoFocus={autoFocus}
        enterKeyHint="search"
        autoComplete="off"
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
