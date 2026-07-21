import { useEffect, useRef, useState } from 'react'
import { FiSearch, FiX } from 'react-icons/fi'
import { Link } from 'react-router-dom'
import { adminApi } from '../../services/adminApi.js'

function AdminGlobalSearch() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState(null)
  const [open, setOpen] = useState(false)
  const box = useRef(null)

  useEffect(() => {
    const outside = (event) => !box.current?.contains(event.target) && setOpen(false)
    document.addEventListener('mousedown', outside)
    return () => document.removeEventListener('mousedown', outside)
  }, [])

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults(null)
      return undefined
    }

    const timer = setTimeout(async () => {
      try {
        setResults(await adminApi.search(query))
        setOpen(true)
      } catch {
        setResults(null)
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [query])

  const groups = results
    ? [
        { key: 'products', label: 'Products', path: (item) => `/admin/products/${item.id}/edit`, title: (item) => item.name },
        { key: 'orders', label: 'Orders', path: (item) => `/admin/orders/${item.id}`, title: (item) => item.orderNumber },
        { key: 'customOrders', label: 'Custom Orders', path: (item) => `/admin/custom-orders/${item.id}`, title: (item) => item.requestNumber },
        { key: 'users', label: 'Users', path: () => '/admin/users', title: (item) => `${item.firstName} ${item.lastName}` },
        { key: 'categories', label: 'Categories', path: () => '/admin/categories', title: (item) => item.name },
      ]
    : []

  return (
    <div ref={box} className="relative min-w-0 flex-1 sm:w-full sm:max-w-xl">
      <FiSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted sm:left-4" />
      <input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        onFocus={() => results && setOpen(true)}
        className="input-field h-10 min-h-10 truncate bg-cream pl-9 pr-8 sm:h-11 sm:min-h-11 sm:pl-11 sm:pr-10"
        placeholder="Search admin…"
        aria-label="Search products, orders, custom orders, users, and categories"
      />
      {query && (
        <button type="button" onClick={() => { setQuery(''); setOpen(false) }} className="absolute right-1 top-1/2 -translate-y-1/2 p-2 text-muted sm:right-2" aria-label="Clear search">
          <FiX />
        </button>
      )}
      {open && (
        <div className="absolute -left-12 right-0 top-full z-50 mt-2 max-h-[65dvh] min-w-[min(90vw,20rem)] overflow-y-auto overscroll-contain rounded-2xl border border-gold/15 bg-white p-3 shadow-luxury sm:left-0 sm:min-w-0">
          {groups.map((group) => group.key && results[group.key]?.length > 0 && (
            <div key={group.key} className="mb-3">
              <p className="px-3 py-1 text-[.65rem] font-bold uppercase tracking-wider text-gold">{group.label}</p>
              {results[group.key].map((item) => (
                <Link key={item.id} to={group.path(item)} onClick={() => setOpen(false)} className="block break-words rounded-xl px-3 py-2 text-sm hover:bg-pink-light">
                  {group.title(item)}
                </Link>
              ))}
            </div>
          ))}
          {!groups.some((group) => results[group.key]?.length) && <p className="p-4 text-center text-sm text-muted">No matches found.</p>}
        </div>
      )}
    </div>
  )
}

export default AdminGlobalSearch
