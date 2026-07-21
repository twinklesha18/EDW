import { useCallback, useState } from 'react'
import { FiEdit2, FiPlus, FiTrash2 } from 'react-icons/fi'
import toast from 'react-hot-toast'
import { Link } from 'react-router-dom'
import AdminPageHeader from '../../components/admin/AdminPageHeader.jsx'
import AdminPagination from '../../components/admin/AdminPagination.jsx'
import DataTable from '../../components/admin/DataTable.jsx'
import ConfirmModal from '../../components/common/ConfirmModal.jsx'
import ErrorState from '../../components/common/ErrorState.jsx'
import { useAdminQuery } from '../../hooks/useAdminQuery.js'
import { adminApi } from '../../services/adminApi.js'
import { formatCurrency } from '../../utils/formatCurrency.js'

function AdminProductsPage() {
  const [query, setQuery] = useState({ page: 1, search: '', sort: 'newest' })
  const [removing, setRemoving] = useState(null)
  const fetcher = useCallback(() => adminApi.list('products', query), [query])
  const { data, loading, error, reload } = useAdminQuery(fetcher, [fetcher])

  const remove = async () => {
    try {
      await adminApi.remove('products', removing.id)
      toast.success('Product deleted successfully.')
      setRemoving(null)
      reload()
    } catch (actionError) {
      toast.error(actionError?.response?.data?.message || 'Unable to delete product.')
    }
  }

  const columns = [
    { key: 'product', label: 'Product Name', render: (row) => <div className="flex min-w-56 items-center gap-3"><img src={row.image?.url} alt="" className="h-12 w-12 rounded-xl object-cover" /><p className="font-semibold">{row.name}</p></div> },
    { key: 'category', label: 'Category', render: (row) => row.category?.name || '—' },
    { key: 'sizeS', label: 'S Price', render: (row) => formatCurrency(row.prices?.S) },
    { key: 'sizeM', label: 'M Price', render: (row) => formatCurrency(row.prices?.M) },
    { key: 'sizeL', label: 'L Price', render: (row) => formatCurrency(row.prices?.L) },
    { key: 'actions', label: 'Actions', render: (row) => <div className="flex gap-1"><Link to={`/admin/products/${row.id}/edit`} className="icon-button" aria-label="Edit product"><FiEdit2 /></Link><button type="button" className="icon-button text-red-600" onClick={() => setRemoving(row)} aria-label="Delete product"><FiTrash2 /></button></div> },
  ]

  return (
    <div className="space-y-6">
      <AdminPageHeader title="Products" description="Manage product names, categories, descriptions, size prices, and images." action={<Link to="/admin/products/new" className="primary-button"><FiPlus /> New Product</Link>} />
      <div className="rounded-[1.75rem] border border-gold/15 bg-white">
        <div className="grid gap-3 p-4 sm:grid-cols-2">
          <input className="input-field" placeholder="Search product name…" value={query.search} onChange={(event) => setQuery((current) => ({ ...current, search: event.target.value, page: 1 }))} />
          <select className="input-field" value={query.sort} onChange={(event) => setQuery((current) => ({ ...current, sort: event.target.value, page: 1 }))}>
            <option value="newest">Newest</option><option value="oldest">Oldest</option><option value="name">Product Name</option><option value="price">S Price</option>
          </select>
        </div>
        {error ? <div className="p-5"><ErrorState message={error} onRetry={reload} /></div> : <DataTable columns={columns} rows={data?.products} loading={loading} emptyTitle="No products found" />}
        <AdminPagination pagination={data?.pagination} onPage={(page) => setQuery((current) => ({ ...current, page }))} />
      </div>
      <ConfirmModal open={Boolean(removing)} title="Delete product?" message={`${removing?.name || 'This product'} and its image will be permanently removed.`} confirmLabel="Delete" onClose={() => setRemoving(null)} onConfirm={remove} />
    </div>
  )
}

export default AdminProductsPage
