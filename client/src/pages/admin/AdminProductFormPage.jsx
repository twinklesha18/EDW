import { useEffect, useState } from 'react'
import { FiArrowLeft, FiCheckCircle, FiCircle, FiTrash2, FiUploadCloud } from 'react-icons/fi'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { Link, useNavigate, useParams } from 'react-router-dom'
import AdminPageHeader from '../../components/admin/AdminPageHeader.jsx'
import FormInput from '../../components/common/FormInput.jsx'
import LoadingButton from '../../components/common/LoadingButton.jsx'
import api, { getApiError } from '../../services/api.js'
import { adminApi, uploadSingleImage } from '../../services/adminApi.js'
import { orderProductImages } from '../../utils/productImageOrder.js'

const defaults = { name: '', category: '', description: '', priceS: '', priceM: '', priceL: '' }

function AdminProductFormPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const editing = Boolean(id)
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(editing)
  const [saving, setSaving] = useState(false)
  const [apiError, setApiError] = useState('')
  const [images, setImages] = useState([])
  const [imageFiles, setImageFiles] = useState([])
  const [mainImage, setMainImage] = useState(null)
  const [previewUrls, setPreviewUrls] = useState([])
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
          const savedImages = Array.isArray(product.images) && product.images.length ? product.images : [product.image].filter((item) => item?.url)
          const visibleImages = savedImages.slice(0, 3)
          setImages(visibleImages)
          setMainImage(visibleImages[0] || null)
        }
      })
      .catch((error) => setApiError(getApiError(error).message))
      .finally(() => setLoading(false))
  }, [editing, id, reset])

  useEffect(() => {
    const urls = imageFiles.map((file) => URL.createObjectURL(file))
    setPreviewUrls(urls)
    return () => urls.forEach((url) => URL.revokeObjectURL(url))
  }, [imageFiles])

  const selectImages = (event) => {
    const selected = Array.from(event.target.files || [])
    const remaining = Math.max(0, 3 - images.length - imageFiles.length)
    if (selected.length > remaining) toast.error(`You can add only ${remaining} more ${remaining === 1 ? 'image' : 'images'}.`)
    if (remaining > 0) {
      const accepted = selected.slice(0, remaining)
      setImageFiles((current) => [...current, ...accepted])
      if (!mainImage && accepted[0]) setMainImage(accepted[0])
      setImageError('')
      setApiError('')
    }
    event.target.value = ''
  }

  const submit = async (values) => {
    if (images.length + imageFiles.length < 1) {
      setImageError('At least one product image is required.')
      setApiError('Please upload at least one product image.')
      document.querySelector('#product-image')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return
    }
    setSaving(true)
    setApiError('')
    setImageError('')
    clearErrors()
    try {
      const uploadedImages = []
      for (const file of imageFiles) uploadedImages.push(await uploadSingleImage(file, 'products'))
      const orderedImages = orderProductImages({ savedImages: images, uploadedImages, selectedFiles: imageFiles, selectedImage: mainImage })
      const productImages = orderedImages.map((item) => ({ ...item, alt: values.name }))
      const payload = {
        name: values.name,
        category: values.category,
        description: values.description,
        prices: { S: Number(values.priceS), M: Number(values.priceM), L: Number(values.priceL) },
        image: productImages[0],
        images: productImages,
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
        if (issue.field === 'image' || issue.field === 'images' || issue.field?.startsWith('image.') || issue.field?.startsWith('images.')) setImageError(issue.message)
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
        description="Add the product details, prices for each size, and up to three images."
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
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div><h2 className="font-serif text-2xl font-semibold">Product Images</h2><p className="mt-1 text-sm text-muted">Add up to three images, then tick the one you want to use as the main image.</p></div>
            <span className="rounded-full bg-pink-light px-3 py-1 text-xs font-semibold text-rosewood">{images.length + imageFiles.length}/3 images</span>
          </div>
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {images.map((item, index) => {
              const isMain = mainImage === item
              return (
              <div key={item.publicId || item.url} className={`relative overflow-hidden rounded-2xl border-2 bg-cream transition ${isMain ? 'border-rosewood ring-4 ring-pink-light' : 'border-gold/20'}`}>
                <img src={item.url} alt={`Saved product preview ${index + 1}`} className="aspect-square w-full object-cover" />
                <span className={`absolute left-3 top-3 rounded-full px-2.5 py-1 text-[.65rem] font-bold uppercase shadow-sm ${isMain ? 'bg-rosewood text-white' : 'bg-white/90 text-rosewood'}`}>{isMain ? 'Main image' : `Image ${index + 1}`}</span>
                <button type="button" onClick={() => { const remainingImages = images.filter((_, itemIndex) => itemIndex !== index); setImages(remainingImages); if (isMain) setMainImage(remainingImages[0] || imageFiles[0] || null) }} className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-white/95 text-red-600 shadow-sm" aria-label={`Remove saved image ${index + 1}`}><FiTrash2 aria-hidden="true" /></button>
                <button type="button" onClick={() => setMainImage(item)} aria-pressed={isMain} className={`flex min-h-12 w-full items-center justify-center gap-2 px-4 text-sm font-semibold transition ${isMain ? 'bg-rosewood text-white' : 'bg-white text-ink hover:bg-pink-light'}`}>{isMain ? <FiCheckCircle aria-hidden="true" /> : <FiCircle aria-hidden="true" />}{isMain ? 'Selected as Main' : 'Set as Main Image'}</button>
              </div>
            )})}
            {previewUrls.map((url, index) => {
              const position = images.length + index
              return (
                <div key={url} className={`relative overflow-hidden rounded-2xl border-2 bg-cream transition ${mainImage === imageFiles[index] ? 'border-rosewood ring-4 ring-pink-light' : 'border-rosewood/30'}`}>
                  <img src={url} alt={`New product preview ${position + 1}`} className="aspect-square w-full object-cover" />
                  <span className={`absolute left-3 top-3 rounded-full px-2.5 py-1 text-[.65rem] font-bold uppercase shadow-sm ${mainImage === imageFiles[index] ? 'bg-rosewood text-white' : 'bg-white/90 text-rosewood'}`}>{mainImage === imageFiles[index] ? 'Main image' : `New image ${position + 1}`}</span>
                  <button type="button" onClick={() => { const selectedFile = imageFiles[index]; const remainingFiles = imageFiles.filter((_, itemIndex) => itemIndex !== index); setImageFiles(remainingFiles); if (mainImage === selectedFile) setMainImage(images[0] || remainingFiles[0] || null) }} className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-white/95 text-red-600 shadow-sm" aria-label={`Remove selected image ${position + 1}`}><FiTrash2 aria-hidden="true" /></button>
                  <button type="button" onClick={() => setMainImage(imageFiles[index])} aria-pressed={mainImage === imageFiles[index]} className={`flex min-h-12 w-full items-center justify-center gap-2 px-4 text-sm font-semibold transition ${mainImage === imageFiles[index] ? 'bg-rosewood text-white' : 'bg-white text-ink hover:bg-pink-light'}`}>{mainImage === imageFiles[index] ? <FiCheckCircle aria-hidden="true" /> : <FiCircle aria-hidden="true" />}{mainImage === imageFiles[index] ? 'Selected as Main' : 'Set as Main Image'}</button>
                </div>
              )
            })}
            {images.length + imageFiles.length < 3 && (
              <label className="grid aspect-square cursor-pointer place-items-center rounded-2xl border-2 border-dashed border-gold/30 bg-cream text-center text-sm text-muted transition hover:border-rosewood hover:bg-pink-light/30">
                <span><FiUploadCloud className="mx-auto mb-2 text-3xl text-rosewood" /><strong className="text-ink">Choose images</strong><span className="mt-1 block text-xs">Phone or computer</span></span>
                <input type="file" accept="image/*,.heic,.heif" multiple className="sr-only" onChange={selectImages} />
              </label>
            )}
          </div>
          {imageError && <p className="mt-2 text-sm text-red-600">{imageError}</p>}
          <p className="mt-3 text-sm text-muted">Choose one or multiple photos from your phone gallery or computer. JPEG, PNG, WebP, AVIF, HEIC, and HEIF are supported up to 12 MB per image.</p>
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
