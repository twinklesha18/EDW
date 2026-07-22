import { useCallback, useEffect, useState } from 'react'
import { FiEdit2, FiPlus, FiPower, FiTrash2 } from 'react-icons/fi'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import AdminFormModal from '../../components/admin/AdminFormModal.jsx'
import AdminPageHeader from '../../components/admin/AdminPageHeader.jsx'
import AdminPagination from '../../components/admin/AdminPagination.jsx'
import DataTable from '../../components/admin/DataTable.jsx'
import StatusBadge from '../../components/admin/StatusBadge.jsx'
import ConfirmModal from '../../components/common/ConfirmModal.jsx'
import FormInput from '../../components/common/FormInput.jsx'
import LoadingButton from '../../components/common/LoadingButton.jsx'
import { useAdminQuery } from '../../hooks/useAdminQuery.js'
import { adminApi, uploadSingleImage } from '../../services/adminApi.js'

const defaults = { title: '', position: 'hero' }

function AdminBannersPage() {
  const [query, setQuery] = useState({ page: 1, status: '', position: '' })
  const [editor, setEditor] = useState(null)
  const [deleting, setDeleting] = useState(null)
  const [saving, setSaving] = useState(false)
  const [imageFile, setImageFile] = useState(null)
  const fetcher = useCallback(() => adminApi.list('banners', query), [query])
  const { data, loading, error, reload } = useAdminQuery(fetcher, [fetcher])
  const { register, reset, handleSubmit } = useForm({ defaultValues: defaults })

  useEffect(() => {
    if (editor) reset({ title: editor.title || '', position: ['hero', 'promotional', 'gallery'].includes(editor.position) ? editor.position : 'hero' })
  }, [editor, reset])

  const closeEditor = () => { setEditor(null); setImageFile(null) }
  const save = async (values) => {
    if (!imageFile && !editor?.image?.url) return toast.error('Homepage image is required.')
    setSaving(true)
    try {
      const image = imageFile ? await uploadSingleImage(imageFile, 'banners') : editor.image
      const payload = { title: values.title, position: values.position, image, isActive: editor?.id ? editor.isActive !== false : true }
      if (editor.id) await adminApi.update('banners', editor.id, payload)
      else await adminApi.create('banners', payload)
      toast.success('Homepage image saved successfully.')
      closeEditor(); reload()
    } catch (requestError) {
      const detail = requestError.response?.data?.errors?.[0]?.message
      toast.error(detail || requestError.response?.data?.message || 'Unable to save homepage image.')
    } finally { setSaving(false) }
  }

  const remove = async () => {
    try { await adminApi.remove('banners', deleting.id); toast.success('Homepage image deleted.'); setDeleting(null); reload() }
    catch (requestError) { toast.error(requestError.response?.data?.message || 'Unable to delete homepage image.') }
  }
  const toggle = async (row) => {
    try { await adminApi.patch('banners', row.id, 'toggle'); toast.success(`Homepage image ${row.isActive ? 'hidden' : 'shown'}.`); reload() }
    catch (requestError) { toast.error(requestError.response?.data?.message || 'Unable to update homepage image.') }
  }

  const columns = [
    { key: 'banner', label: 'Homepage image', render: (row) => <div className="flex min-w-64 items-center gap-3"><img src={row.image?.url} alt={row.title} className="h-14 w-24 rounded-xl object-cover" /><p className="font-semibold">{row.title}</p></div> },
    { key: 'position', label: 'Section', render: (row) => <span className="capitalize">{row.position}</span> },
    { key: 'status', label: 'Status', render: (row) => <StatusBadge>{row.isActive ? 'Visible' : 'Hidden'}</StatusBadge> },
    { key: 'actions', label: 'Actions', render: (row) => <div className="flex"><button type="button" className="icon-button" onClick={() => setEditor(row)} title="Edit image"><FiEdit2 /></button><button type="button" className="icon-button" onClick={() => toggle(row)} title={row.isActive ? 'Hide image' : 'Show image'}><FiPower /></button><button type="button" className="icon-button text-red-600" onClick={() => setDeleting(row)} title="Delete image"><FiTrash2 /></button></div> },
  ]

  return <div className="space-y-6">
    <AdminPageHeader title="Homepage Images" description="Manage the images displayed in the hero, promotional, and gallery sections." action={<button type="button" className="primary-button" onClick={() => setEditor({})}><FiPlus /> New Homepage Image</button>} />
    <div className="overflow-hidden rounded-[1.75rem] border border-gold/15 bg-white">
      <div className="grid gap-3 p-4 sm:grid-cols-2"><select className="input-field" value={query.status} onChange={(event) => setQuery((current) => ({ ...current, status: event.target.value, page: 1 }))}><option value="">All visibility</option><option value="active">Visible</option><option value="inactive">Hidden</option></select><select className="input-field" value={query.position} onChange={(event) => setQuery((current) => ({ ...current, position: event.target.value, page: 1 }))}><option value="">All homepage sections</option><option value="hero">Hero</option><option value="promotional">Promotional</option><option value="gallery">Gallery</option></select></div>
      {error ? <p className="p-5 text-red-600">{error}</p> : <DataTable columns={columns} rows={data?.banners} loading={loading} emptyTitle="No homepage images found" />}
      <AdminPagination pagination={data?.pagination} onPage={(page) => setQuery((current) => ({ ...current, page }))} />
    </div>

    <AdminFormModal open={Boolean(editor)} title={editor?.id ? 'Edit Homepage Image' : 'New Homepage Image'} onClose={closeEditor}>
      <form onSubmit={handleSubmit(save)} className="grid gap-5 sm:grid-cols-2">
        <FormInput label="Image name / description" {...register('title', { required: true })} />
        <label><span className="form-label">Homepage section</span><select className="input-field" {...register('position')}><option value="hero">Hero</option><option value="promotional">Promotional</option><option value="gallery">Gallery</option></select></label>
        <label className="sm:col-span-2"><span className="form-label">Image</span>{editor?.image?.url && !imageFile && <img src={editor.image.url} alt={editor.title} className="mb-3 max-h-48 w-full rounded-2xl bg-cream object-contain" />}<input type="file" accept="image/*,.heic,.heif" className="input-field py-3" required={!editor?.image?.url} onChange={(event) => setImageFile(event.target.files?.[0] || null)} /><span className="mt-2 block text-xs text-muted">Upload from a phone or computer. JPEG, PNG, WebP, AVIF, HEIC, and HEIF are supported.</span></label>
        <div className="flex justify-end gap-3 sm:col-span-2"><button type="button" className="secondary-button" onClick={closeEditor}>Cancel</button><LoadingButton type="submit" loading={saving} className="primary-button">Save Image</LoadingButton></div>
      </form>
    </AdminFormModal>

    <ConfirmModal open={Boolean(deleting)} title="Delete homepage image?" message="This image will be permanently removed from the storefront." confirmLabel="Delete" onClose={() => setDeleting(null)} onConfirm={remove} />
  </div>
}

export default AdminBannersPage
