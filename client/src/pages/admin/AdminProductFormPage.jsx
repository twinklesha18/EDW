import { useEffect, useState } from 'react'
import { FiArrowLeft, FiUploadCloud } from 'react-icons/fi'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { Link, useNavigate, useParams } from 'react-router-dom'
import AdminPageHeader from '../../components/admin/AdminPageHeader.jsx'
import FormInput from '../../components/common/FormInput.jsx'
import LoadingButton from '../../components/common/LoadingButton.jsx'
import api, { getApiError } from '../../services/api.js'
import { adminApi, uploadSingleImage } from '../../services/adminApi.js'

const defaults = { name: '', category: '', description: '', priceS: '', priceM: '', priceL: '' }

function AdminProductFormPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const editing = Boolean(id)
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(editing)
  const [saving, setSaving] = useState(false)
  const [apiError, setApiError] = useState('')
  const [image, setImage] = useState(null)
  const [imageFile, setImageFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState('')
  const [imageError, setImageError] = useState('')
  const { register, reset, handleSubmit, setError, setFocus, clearErrors, formState: { errors } } = useForm({ defaultValues: defaults })

  useEffect(() => {
    Promise.all([api.get('/categories'), editing ? adminApi.get('products', id) : Promise.resolve(null)])
      .then(([categoryResponse, productResponse]) => {
        setCategories(categoryResponse.data.data.categories)
        if (productResponse?.product) {
          const product = productResponse.product
          reset({
            name: product.name,
            category: product.category?.id || product.category?._id || '',
            description: product.description,
            priceS: product.prices?.S ?? '',
            priceM: product.prices?.M ?? '',
            priceL: product.prices?.L ?? '',
          })
          setImage(product.image)
        }
      })
      .catch((error) => setApiError(getApiError(error).message))
      .finally(() => setLoading(false))
  }, [editing, id, reset])

  useEffect(() => {
    if (!imageFile) {
      setPreviewUrl('')
      return undefined
    }
    const url = URL.createObjectURL(imageFile)
    setPreviewUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [imageFile])

  const submit = async (values) => {
    if (!imageFile && !image?.url) {
      setImageError('Product image is required.')
      setApiError('Please upload a product image.')
      document.querySelector('#product-image')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return
    }
    setSaving(true)
    setApiError('')
    setImageError('')
    clearErrors()
    try {
      const uploadedImage = imageFile ? await uploadSingleImage(imageFile, 'products') : image
      if (imageFile) {
        setImage(uploadedImage)
        setImageFile(null)
      }
      const payload = {
        name: values.name,
        category: values.category,
        description: values.description,
        prices: { S: Number(values.priceS), M: Number(values.priceM), L: Number(values.priceL) },
        image: { ...uploadedImage, alt: values.name },
      }
      if (editing) await adminApi.update('products', id, payload)
      else await adminApi.create('products', payload)
      toast.success(editing ? 'Product updated successfully.' : 'Product created successfully.')
      navigate('/admin/products')
    } catch (error) {
      const apiErrorDetails = getApiError(error)
      const fieldMap = { name: 'name', category: 'category', description: 'description', 'prices.S': 'priceS', 'prices.M': 'priceM', 'prices.L': 'priceL' }
      apiErrorDetails.errors.forEach((issue) => {
        const field = fieldMap[issue.field]
        if (field) setError(field, { type: 'server', message: issue.message })
        if (issue.field === 'image' || issue.field?.startsWith('image.')) setImageError(issue.message)
      })
      const messages = [...new Set(apiErrorDetails.errors.map((issue) => issue.message).filter(Boolean))]
      setApiError(messages.length ? messages.join(' ') : apiErrorDetails.message)
      const firstField = fieldMap[apiErrorDetails.errors[0]?.field]
      if (firstField) setTimeout(() => setFocus(firstField), 0)
      else if (apiErrorDetails.errors[0]?.field?.startsWith('image')) document.querySelector('#product-image')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    } finally {
      setSaving(false)
    }
  }

  const invalid = (formErrors) => {
    const firstField = Object.keys(formErrors)[0]
    const messages = [...new Set(Object.values(formErrors).map((item) => item?.message).filter(Boolean))]
    setApiError(messages.join(' ') || 'Please complete all required fields.')
    if (firstField) setFocus(firstField)
  }

  if (loading) return <div className="animate-pulse rounded-[2rem] bg-white p-12 text-center text-muted">Loading product…</div>

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={editing ? 'Edit Product' : 'Create Product'}
        description="Add the product details, prices for each size, and one image."
        action={<Link to="/admin/products" className="secondary-button"><FiArrowLeft /> Products</Link>}
      />
      {apiError && <p className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{apiError}</p>}
      <form onSubmit={handleSubmit(submit, invalid)} className="space-y-6" noValidate>
        <section id="product-image" className={`form-section ${imageError ? 'border-red-300' : ''}`}>
          <div className="grid gap-5 sm:grid-cols-2">
            <FormInput label="Product Name" error={errors.name?.message} {...register('name', { required: 'Product name is required.', minLength: { value: 2, message: 'Use at least 2 characters.' } })} />
            <label>
              <span className="form-label">Category</span>
              <select className="input-field" {...register('category', { required: 'Category is required.' })}>
                <option value="">Select category</option>
                {categories.map((category) => {
                  const categoryId = category.id || category._id
                  return <option key={categoryId} value={categoryId}>{category.name}</option>
                })}
              </select>
              {errors.category && <span className="mt-1 block text-xs text-red-600">{errors.category.message}</span>}
            </label>
            <label className="sm:col-span-2">
              <span className="form-label">Description</span>
              <textarea className="input-field min-h-40" maxLength={5000} {...register('description', { required: 'Description is required.', minLength: { value: 10, message: 'Use at least 10 characters.' } })} />
              {errors.description && <span className="mt-1 block text-xs text-red-600">{errors.description.message}</span>}
            </label>
          </div>
        </section>

        <section className="form-section">
          <h2 className="font-serif text-2xl font-semibold">Size & Price</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            <FormInput label="S Price" type="number" min="0.01" step="0.01" error={errors.priceS?.message} {...register('priceS', { required: 'S price is required.', min: { value: 0.01, message: 'Enter a valid price.' } })} />
            <FormInput label="M Price" type="number" min="0.01" step="0.01" error={errors.priceM?.message} {...register('priceM', { required: 'M price is required.', min: { value: 0.01, message: 'Enter a valid price.' } })} />
            <FormInput label="L Price" type="number" min="0.01" step="0.01" error={errors.priceL?.message} {...register('priceL', { required: 'L price is required.', min: { value: 0.01, message: 'Enter a valid price.' } })} />
          </div>
        </section>

        <section className="form-section">
          <h2 className="font-serif text-2xl font-semibold">Image</h2>
          <label className="mt-5 grid max-w-xs cursor-pointer place-items-center overflow-hidden rounded-2xl border-2 border-dashed border-gold/30 bg-cream">
            {previewUrl || image?.url
              ? <img src={previewUrl || image.url} alt="Product preview" className="aspect-square w-full object-cover" />
              : <span className="grid aspect-square w-full place-items-center text-center text-sm text-muted"><span><FiUploadCloud className="mx-auto mb-2 text-2xl" />Upload image</span></span>}
            <input type="file" accept="image/*,.heic,.heif" className="sr-only" onChange={(event) => { const file = event.target.files?.[0] || null; setImageFile(file); if (file) { setImageError(''); setApiError('') } }} />
          </label>
          {imageError && <p className="mt-2 text-sm text-red-600">{imageError}</p>}
          <p className="mt-3 text-sm text-muted">Choose a photo from your phone gallery, phone camera, or computer. JPEG, PNG, WebP, AVIF, HEIC, and HEIF are supported up to 12 MB.</p>
        </section>

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Link to="/admin/products" className="secondary-button w-full sm:w-auto">Cancel</Link>
          <LoadingButton type="submit" loading={saving} className="primary-button w-full sm:w-auto">{editing ? 'Save Product' : 'Create Product'}</LoadingButton>
        </div>
      </form>
    </div>
  )
}

export default AdminProductFormPage
