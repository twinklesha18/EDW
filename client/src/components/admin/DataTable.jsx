import { useMemo, useState } from 'react'
import EmptyState from '../common/EmptyState.jsx'
import LoadingSkeleton from '../common/LoadingSkeleton.jsx'

function DataTable({ columns, rows, loading, emptyTitle = 'No records found', rowKey = 'id' }) {
  const [sort, setSort] = useState({ key: '', direction: 'asc' })

  const sortedRows = useMemo(() => {
    if (!sort.key) return rows || []

    const column = columns.find((item) => item.key === sort.key)
    return [...(rows || [])].sort((first, second) => {
      const firstValue = column?.sortValue ? column.sortValue(first) : first[sort.key]
      const secondValue = column?.sortValue ? column.sortValue(second) : second[sort.key]
      const result = String(firstValue ?? '').localeCompare(String(secondValue ?? ''), undefined, {
        numeric: true,
        sensitivity: 'base',
      })
      return sort.direction === 'asc' ? result : -result
    })
  }, [columns, rows, sort])

  const changeSort = (column) => {
    if (column.sortable === false || ['actions', 'view'].includes(column.key)) return

    setSort((current) => ({
      key: column.key,
      direction: current.key === column.key && current.direction === 'asc' ? 'desc' : 'asc',
    }))
  }

  const cellValue = (column, row) => (column.render ? column.render(row) : row[column.key])
  const sortableColumns = columns.filter(
    (column) => column.sortable !== false && !['actions', 'view'].includes(column.key),
  )

  if (loading) return <LoadingSkeleton />
  if (!rows?.length) return <EmptyState title={emptyTitle} message="Try adjusting the search or filters." />

  return (
    <>
      <div className="space-y-3 p-3 sm:p-4 md:hidden">
        {sortableColumns.length > 0 && (
          <div className="flex min-w-0 items-center justify-end gap-2">
            <label htmlFor="mobile-table-sort" className="shrink-0 text-xs font-semibold text-muted">
              Sort by
            </label>
            <select
              id="mobile-table-sort"
              className="min-h-10 min-w-0 max-w-48 flex-1 rounded-xl border border-gold/25 bg-white px-3 text-sm outline-none focus:border-gold"
              value={sort.key ? `${sort.key}:${sort.direction}` : ''}
              onChange={(event) => {
                const [key, direction] = event.target.value.split(':')
                setSort({ key, direction: direction || 'asc' })
              }}
            >
              <option value="">Default order</option>
              {sortableColumns.flatMap((column) => [
                <option key={`${column.key}:asc`} value={`${column.key}:asc`}>
                  {column.label} (A–Z)
                </option>,
                <option key={`${column.key}:desc`} value={`${column.key}:desc`}>
                  {column.label} (Z–A)
                </option>,
              ])}
            </select>
          </div>
        )}

        {sortedRows.map((row) => (
          <article
            key={row[rowKey] || row._id}
            className="min-w-0 overflow-hidden rounded-2xl border border-gold/15 bg-white p-4 shadow-[0_12px_35px_-30px_rgba(59,47,54,0.45)]"
          >
            {columns.map((column, index) => {
              const isAction = ['actions', 'view'].includes(column.key)

              if (index === 0) {
                return (
                  <div
                    key={column.key}
                    className="mb-3 min-w-0 overflow-hidden border-b border-gold/10 pb-3 [&_*]:min-w-0"
                  >
                    <p className="mb-1 text-[.62rem] font-bold uppercase tracking-wider text-gold">
                      {column.label}
                    </p>
                    {cellValue(column, row)}
                  </div>
                )
              }

              if (isAction) {
                return (
                  <div
                    key={column.key}
                    className="mt-3 flex min-w-0 flex-wrap items-center justify-end gap-2 border-t border-gold/10 pt-3 [&_*]:min-w-0"
                  >
                    {cellValue(column, row)}
                  </div>
                )
              }

              return (
                <div
                  key={column.key}
                  className="grid min-w-0 grid-cols-[minmax(0,.8fr)_minmax(0,1.2fr)] gap-3 border-b border-gold/10 py-2.5 last:border-0"
                >
                  <span className="text-xs font-semibold text-muted">{column.label}</span>
                  <div className="min-w-0 break-words text-right text-sm text-ink [&_*]:min-w-0">
                    {cellValue(column, row)}
                  </div>
                </div>
              )
            })}
          </article>
        ))}
      </div>

      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[760px] border-collapse text-left">
          <thead>
            <tr className="border-b border-gold/15 bg-pink-light/35">
              {columns.map((column) => (
                <th key={column.key} className="px-4 py-3 text-[.68rem] font-bold uppercase tracking-wider text-muted">
                  <button
                    type="button"
                    className={`inline-flex items-center gap-1 ${
                      column.sortable === false || ['actions', 'view'].includes(column.key)
                        ? 'cursor-default'
                        : 'hover:text-rosewood'
                    }`}
                    onClick={() => changeSort(column)}
                  >
                    {column.label}
                    {sort.key === column.key && <span aria-hidden="true">{sort.direction === 'asc' ? '↑' : '↓'}</span>}
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedRows.map((row) => (
              <tr key={row[rowKey] || row._id} className="border-b border-gold/10 transition-colors hover:bg-cream">
                {columns.map((column) => (
                  <td key={column.key} className="px-4 py-3 text-sm text-ink">
                    {cellValue(column, row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}

export default DataTable
