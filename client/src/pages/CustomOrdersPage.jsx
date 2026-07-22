import { useEffect, useState } from 'react'
import { FiCheckCircle, FiImage, FiTrash2, FiUploadCloud } from 'react-icons/fi'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { useSelector } from 'react-redux'
import FormField from '../components/common/FormField.jsx'
import LoadingButton from '../components/common/LoadingButton.jsx'
import PageBanner from '../components/common/PageBanner.jsx'
import PageTransition from '../components/common/PageTransition.jsx'
import api, { getApiError } from '../services/api.js'

const today = new Date().toLocaleDateString('en-CA')
const budgetRanges = ['Below LKR 5,000', 'LKR 5,000 - 10,000', 'LKR 10,000 - 15,000', 'Above LKR 15,000', 'Discuss with me']

function CustomOrdersPage() {
  const user = useSelector((state) => state.auth.user)
  const [preview, setPreview] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [apiError, setApiError] = useState('')
  const [confirmation, setConfirmation] = useState(null)
  const { register, handleSubmit, reset, setValue, setError, formState: { errors } } = useForm()
  const imageRegistration = register('inspiration', {
    validate: (files) => !files?.[0] || files[0].size <= 12 * 1024 * 1024 || 'Image must be 12 MB or smaller.',
  })

  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview) }, [preview])

  const selectImage = (event) => {
    imageRegistration.onChange(event)
    const file = event.target.files?.[0]
    if (preview) URL.revokeObjectURL(preview)
    setPreview(file ? URL.createObjectURL(file) : '')
  }

  const removeImage = () => {
    if (preview) URL.revokeObjectURL(preview)
    setPreview('')
    setValue('inspiration', null)
    const input = document.getElementById('inspiration-image')
    if (input) input.value = ''
  }

  const submitOrder = async (values) => {
    setSubmitting(true)
    setApiError('')
    setConfirmation(null)
    try {
      const formData = new FormData()
      const fields = ['occasion', 'requiredDate', 'budgetRange', 'preferredColors', 'giftType', 'bouquetType', 'specialMessage', 'description']
      fields.forEach((field) => formData.append(field, values[field] || ''))
      formData.append('agreement', String(Boolean(values.agreement)))
      if (values.inspiration?.[0]) formData.append('inspiration', values.inspiration[0])

      const response = await api.post('/custom-orders', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 60000,
      })
      const submitted = response.data.data.customOrder
      setConfirmation(submitted)
      reset()
      removeImage()
      toast.success(`Custom order ${submitted.requestNumber} submitted successfully.`)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (error) {
      const details = getApiError(error, 'Unable to submit your custom-order request.')
      details.errors.forEach((item) => setError(item.field, { type: 'server', message: item.message }))
      setApiError(details.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <PageTransition>
      <PageBanner eyebrow="Custom Orders" title="Bring Your Dream Gift to Life" description="Tell us about your idea, colors, occasion and budget. We will review your request and contact you with availability and pricing." />
      <section className="section-shell py-12 sm:py-16">
        {confirmation && (
          <div className="mx-auto mb-8 max-w-5xl rounded-[1.5rem] border border-green-200 bg-green-50 p-5 text-green-800 sm:p-6">
            <div className="flex items-start gap-3">
              <FiCheckCircle className="mt-0.5 shrink-0 text-xl" />
              <div>
                <h2 className="font-semibold">Your custom-order request was received</h2>
                <p className="mt-1 text-sm leading-6">Reference: <strong>{confirmation.requestNumber}</strong>. We will contact you after reviewing the design and required date.</p>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit(submitOrder)} className="mx-auto max-w-5xl space-y-8" noValidate>
          <div className="rounded-2xl border border-gold/20 bg-pink-light/35 px-4 py-3 text-sm leading-6 text-muted sm:px-5">
            This request will be securely linked to <strong className="text-ink">{user?.firstName} {user?.lastName}</strong> and your registered account contact information.
          </div>
          {apiError && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{apiError}</p>}

          <fieldset className="form-section">
            <legend className="form-section-title"><span>1</span> Occasion &amp; Budget</legend>
            <div className="mt-7 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              <FormField label="Occasion" name="occasion" register={register} rules={{ required: 'Please select an occasion.' }} error={errors.occasion} options={['Birthday', 'Engagement', 'Anniversary', 'Proposal', 'Baby Shower', 'Graduation', 'Wedding', 'Other']} />
              <FormField label="Required Date" name="requiredDate" type="date" min={today} register={register} rules={{ required: 'Required date is required.', validate: (value) => value >= today || 'Date cannot be in the past.' }} error={errors.requiredDate} />
              <FormField label="Budget Range" name="budgetRange" register={register} rules={{ required: 'Please select a budget range.' }} error={errors.budgetRange} options={budgetRanges} />
            </div>
          </fieldset>

          <fieldset className="form-section">
            <legend className="form-section-title"><span>2</span> Design Preferences</legend>
            <div className="mt-7 grid gap-5 sm:grid-cols-2">
              <FormField label="Preferred Colors" name="preferredColors" register={register} rules={{ required: 'Tell us your preferred colors.' }} error={errors.preferredColors} placeholder="For example: blush pink, lavender and gold" />
              <FormField label="Gift Type" name="giftType" register={register} rules={{ required: 'Please choose a gift type.' }} error={errors.giftType} options={['Bouquet', 'Gift Hamper', 'Photo Frame', 'Greeting Card', 'Gift Packing', 'Other']} />
              <FormField label="Bouquet Type" name="bouquetType" register={register} error={errors.bouquetType} options={['Chocolate', 'Teddy', 'Earring', 'Snack', 'Kinder Joy', 'Makeup', 'Picture', 'Custom Mix']} />
              <FormField label="Special Message" name="specialMessage" register={register} error={errors.specialMessage} placeholder="Message to include with the gift" />
              <div className="sm:col-span-2">
                <FormField label="Description" name="description" type="textarea" register={register} rules={{ required: 'Please describe your idea.', minLength: { value: 20, message: 'Please write at least 20 characters.' } }} error={errors.description} placeholder="Describe the look, contents, recipient and any meaningful details…" />
              </div>
            </div>
          </fieldset>

          <fieldset className="form-section">
            <legend className="form-section-title"><span>3</span> Inspiration &amp; Confirmation</legend>
            <div className="mt-7">
              <label htmlFor="inspiration-image" className="form-label">Inspiration Image <span className="font-normal text-muted">(optional, maximum 12 MB)</span></label>
              {!preview ? (
                <label htmlFor="inspiration-image" className="mt-2 flex cursor-pointer flex-col items-center rounded-[1.5rem] border border-dashed border-gold/40 bg-pink-light/30 px-6 py-10 text-center transition-colors hover:bg-pink-light/60">
                  <FiUploadCloud size={28} className="text-rosewood" aria-hidden="true" />
                  <span className="mt-3 text-sm font-semibold text-ink">Choose an inspiration image</span>
                  <span className="mt-1 text-xs text-muted">Phone gallery, camera, or computer file</span>
                </label>
              ) : (
                <div className="mt-2 flex flex-col gap-4 rounded-[1.5rem] border border-gold/20 bg-white p-4 sm:flex-row sm:items-center">
                  <img src={preview} alt="Selected inspiration preview" className="h-36 w-full rounded-xl object-cover sm:w-36" />
                  <div className="flex-1">
                    <p className="flex items-center gap-2 text-sm font-semibold text-ink"><FiImage aria-hidden="true" /> Inspiration selected</p>
                    <button type="button" onClick={removeImage} className="mt-3 inline-flex min-h-10 items-center gap-2 text-xs font-semibold text-red-600"><FiTrash2 aria-hidden="true" /> Remove image</button>
                  </div>
                </div>
              )}
              <input id="inspiration-image" name={imageRegistration.name} ref={imageRegistration.ref} onBlur={imageRegistration.onBlur} onChange={selectImage} type="file" accept="image/*,.heic,.heif" className="sr-only" />
              {errors.inspiration && <p className="mt-1.5 text-xs text-red-600">{errors.inspiration.message}</p>}
              <label className="mt-6 flex min-h-11 items-start gap-3 text-sm leading-6 text-muted">
                <input type="checkbox" className="mt-1 h-4 w-4 shrink-0 accent-[#c26a8b]" {...register('agreement', { required: 'Please confirm the agreement.' })} />
                <span>I confirm that these details are accurate and understand that availability, pricing and delivery will be confirmed before the order is accepted.</span>
              </label>
              {errors.agreement && <p className="mt-1.5 text-xs text-red-600">{errors.agreement.message}</p>}
            </div>
          </fieldset>

          <div className="text-center">
            <LoadingButton type="submit" loading={submitting} className="primary-button w-full px-9 sm:w-auto">Submit Custom Order Request</LoadingButton>
            <p className="mt-3 text-xs text-muted">Your request will appear in the admin dashboard for review.</p>
          </div>
        </form>
      </section>
    </PageTransition>
  )
}

export default CustomOrdersPage
