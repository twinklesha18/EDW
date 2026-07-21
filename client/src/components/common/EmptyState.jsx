import { FiSearch } from 'react-icons/fi'

function EmptyState({ title = 'Nothing found', message, action }) {
  return (
    <div className="rounded-[2rem] border border-dashed border-gold/35 bg-white px-6 py-16 text-center">
      <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-pink-light text-rosewood">
        <FiSearch size={22} aria-hidden="true" />
      </span>
      <h3 className="mt-5 font-serif text-2xl font-semibold text-ink">{title}</h3>
      {message && <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted">{message}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  )
}

export default EmptyState
