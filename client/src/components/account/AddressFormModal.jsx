import { yupResolver } from '@hookform/resolvers/yup'
import { AnimatePresence, motion } from 'framer-motion'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { FiX } from 'react-icons/fi'
import { addressSchema } from '../../utils/validationSchemas.js'
import FormInput from '../common/FormInput.jsx'
import LoadingButton from '../common/LoadingButton.jsx'

const blank = { label: '', fullName: '', phone: '', addressLine1: '', addressLine2: '', city: '', district: '', province: '', postalCode: '', country: 'Sri Lanka', isDefault: false }

function AddressFormModal({ open, address, onClose, onSubmit, loading, apiError }) {
  const { register, reset, handleSubmit, formState: { errors } } = useForm({ resolver: yupResolver(addressSchema), defaultValues: blank })

  useEffect(() => {
    if (open) reset(address ? { ...blank, ...address } : blank)
  }, [address, open, reset])

  useEffect(() => {
    if (!open) return undefined
    const key = (event) => event.key === 'Escape' && !loading && onClose()
    document.addEventListener('keydown', key)
    return () => document.removeEventListener('keydown', key)
  }, [loading, onClose, open])

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-[85] flex items-end justify-center bg-ink/30 backdrop-blur-sm sm:items-center sm:p-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={(event) => event.target === event.currentTarget && !loading && onClose()}>
          <motion.div role="dialog" aria-modal="true" aria-labelledby="address-title" className="safe-area-bottom max-h-[94dvh] w-full max-w-2xl overflow-y-auto overscroll-contain rounded-t-[1.5rem] bg-white p-4 shadow-2xl sm:max-h-[92vh] sm:rounded-[2rem] sm:p-8" initial={{ y: 35 }} animate={{ y: 0 }} exit={{ y: 35 }}>
            <div className="flex min-w-0 items-center justify-between gap-3">
              <h2 id="address-title" className="min-w-0 break-words font-serif text-2xl font-semibold sm:text-3xl">{address ? 'Edit address' : 'Add an address'}</h2>
              <button type="button" className="icon-button" onClick={onClose} aria-label="Close address form"><FiX /></button>
            </div>
            {apiError && <p className="mt-4 break-words rounded-xl bg-red-50 p-3 text-sm text-red-700">{apiError}</p>}
            <form onSubmit={handleSubmit(onSubmit)} className="mt-5 grid gap-4 sm:mt-6 sm:grid-cols-2">
              <FormInput label="Label" placeholder="e.g. Home or Work" error={errors.label?.message} {...register('label')} />
              <FormInput label="Full name" placeholder="Enter the recipient's full name" error={errors.fullName?.message} {...register('fullName')} />
              <FormInput label="Phone" type="tel" inputMode="numeric" maxLength={10} autoComplete="tel" placeholder="Enter a 10-digit phone number" error={errors.phone?.message} {...register('phone')} />
              <FormInput label="Address line 1" placeholder="House number and street name" error={errors.addressLine1?.message} {...register('addressLine1')} />
              <FormInput label="Address line 2 (optional)" placeholder="Apartment, suite, or landmark" error={errors.addressLine2?.message} {...register('addressLine2')} />
              <FormInput label="City" placeholder="Enter the city or town" error={errors.city?.message} {...register('city')} />
              <FormInput label="District" placeholder="Enter the district" error={errors.district?.message} {...register('district')} />
              <FormInput label="Province" placeholder="Enter the province" error={errors.province?.message} {...register('province')} />
              <FormInput label="Postal code (optional)" placeholder="Enter the postal code" error={errors.postalCode?.message} {...register('postalCode')} />
              <FormInput label="Country" readOnly error={errors.country?.message} {...register('country')} />
              <label className="flex min-h-11 items-center gap-3 text-sm text-muted sm:col-span-2"><input type="checkbox" className="h-4 w-4 accent-rosewood" {...register('isDefault')} /> Make this my default address</label>
              <div className="mt-2 flex flex-col-reverse gap-3 sm:col-span-2 sm:flex-row sm:justify-end">
                <button type="button" className="secondary-button w-full sm:w-auto" onClick={onClose} disabled={loading}>Cancel</button>
                <LoadingButton type="submit" loading={loading} className="primary-button w-full sm:w-auto">Save Address</LoadingButton>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default AddressFormModal
