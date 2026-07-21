import { useEffect, useState } from 'react'
import { FiMinus, FiPlus, FiTrash2 } from 'react-icons/fi'
import { Link } from 'react-router-dom'
import { formatCurrency } from '../../utils/formatCurrency.js'

function CartItem({ item, onQuantity, onRemove, compact = false, disabled = false }) {
  const [quantity, setQuantity] = useState(item.quantity)
  useEffect(() => setQuantity(item.quantity), [item.quantity])
  const id = item._id || item.id

  const commit = (value) => {
    const next = Math.max(1, Math.min(99, Number(value) || 1))
    setQuantity(next)
    if (next !== item.quantity) onQuantity(id, next)
  }

  const custom = Object.entries(item.customization || {}).filter(([, value]) => value)

  if (compact) {
    return (
      <div className="flex min-w-0 gap-3 border-b border-gold/10 py-4">
        <img src={item.image} alt="" className="h-14 w-14 shrink-0 rounded-xl object-cover sm:h-16 sm:w-16" />
        <div className="min-w-0 flex-1">
          <Link to={`/product/${item.slug}`} className="line-clamp-2 break-words text-sm font-semibold hover:text-rosewood">
            {item.name}
          </Link>
          <p className="mt-1 break-words text-xs leading-5 text-muted">
            Size {item.size} · Qty {item.quantity} × {formatCurrency(item.price)}
          </p>
        </div>
        <button type="button" onClick={() => onRemove(id)} disabled={disabled} className="icon-button h-8 w-8 text-red-500" aria-label={`Remove ${item.name}`}>
          <FiTrash2 />
        </button>
      </div>
    )
  }

  return (
    <article className="grid min-w-0 grid-cols-[80px_minmax(0,1fr)] gap-3 rounded-[1.25rem] border border-gold/15 bg-white p-3 sm:grid-cols-[110px_minmax(0,1fr)] sm:gap-4 sm:rounded-[1.5rem] sm:p-5">
      <Link className="min-w-0" to={`/product/${item.slug}`}>
        <img src={item.image} alt={item.name} className="aspect-square w-full rounded-xl object-cover" />
      </Link>
      <div className="min-w-0">
        <div className="flex min-w-0 items-start justify-between gap-2 sm:gap-3">
          <div className="min-w-0">
            <p className="truncate text-[.65rem] font-semibold uppercase tracking-wider text-gold sm:text-[.68rem]">{item.category}</p>
            <Link to={`/product/${item.slug}`} className="mt-1 line-clamp-2 break-words font-serif text-lg font-semibold leading-tight hover:text-rosewood sm:text-xl">
              {item.name}
            </Link>
            <p className="mt-1 text-xs text-muted">Size {item.size}</p>
          </div>
          <button type="button" onClick={() => onRemove(id)} disabled={disabled} className="icon-button h-9 w-9 text-red-500" aria-label={`Remove ${item.name}`}>
            <FiTrash2 />
          </button>
        </div>
      </div>

      {custom.length > 0 && (
        <div className="col-span-2 rounded-xl bg-pink-light/55 p-3 text-xs leading-5 text-muted">
          {custom.map(([key, value]) => (
            <p key={key} className="break-words"><span className="font-semibold capitalize text-ink">{key.replace(/([A-Z])/g, ' $1')}:</span> {value}</p>
          ))}
        </div>
      )}

      <div className="col-span-2 flex flex-wrap items-center justify-between gap-3">
        <div className="flex h-10 items-center rounded-full border border-gold/25">
          <button type="button" disabled={disabled || quantity <= 1} onClick={() => commit(quantity - 1)} className="grid h-10 w-10 place-items-center" aria-label="Decrease quantity"><FiMinus /></button>
          <input value={quantity} onChange={(event) => setQuantity(event.target.value)} onBlur={(event) => commit(event.target.value)} onKeyDown={(event) => event.key === 'Enter' && event.currentTarget.blur()} inputMode="numeric" aria-label="Quantity" className="w-9 border-0 bg-transparent text-center text-base font-semibold outline-none sm:w-10 sm:text-sm" />
          <button type="button" disabled={disabled || quantity >= 99} onClick={() => commit(Number(quantity) + 1)} className="grid h-10 w-10 place-items-center" aria-label="Increase quantity"><FiPlus /></button>
        </div>
        <div className="min-w-0 text-right">
          <p className="text-[.65rem] text-muted sm:text-xs">{formatCurrency(item.price)} each</p>
          <p className="break-words font-serif text-lg font-semibold text-rosewood sm:text-xl">{formatCurrency(item.price * item.quantity)}</p>
        </div>
      </div>
    </article>
  )
}

export default CartItem
