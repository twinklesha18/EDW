import { yupResolver } from '@hookform/resolvers/yup'
import { AnimatePresence, motion } from 'framer-motion'
import { useEffect } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { FiX } from 'react-icons/fi'
import { SRI_LANKA_PROVINCE_NAMES, districtsForProvince, normalizeSriLankaDistrict, normalizeSriLankaProvince } from '../../data/sriLankaLocations.js'
import { addressSchema } from '../../utils/validationSchemas.js'
import FormInput from '../common/FormInput.jsx'
import LoadingButton from '../common/LoadingButton.jsx'

const blank = { fullName: '', phone: '', addressLine1: '', city: '', district: '', province: '' }

function AddressFormModal({ open, address, onClose, onSubmit, loading, apiError }) {
  const { control, register, reset, setValue, handleSubmit, formState: { errors } } = useForm({ resolver: yupResolver(addressSchema), defaultValues: blank })
  const province = useWatch({ control, name: 'province' })
  const district = useWatch({ control, name: 'district' })
  const districts = districtsForProvince(province)

  useEffect(() => {
    if (open) reset(address ? {
      fullName: address.fullName || '',
      phone: address.phone || '',
      addressLine1: address.addressLine1 || '',
      city: address.city || '',
      district: normalizeSriLankaDistrict(address.district),
      province: normalizeSriLankaProvince(address.province),
    } : blank)
  }, [address, open, reset])

  useEffect(() => {
    if (district && !districts.includes(district)) setValue('district', '', { shouldValidate: true })
  }, [district, districts, setValue])

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
              <FormInput label="Full name" placeholder="Enter the recipient's full name" error={errors.fullName?.message} {...register('fullName')} />
              <FormInput label="Phone" type="tel" inputMode="numeric" maxLength={10} autoComplete="tel" placeholder="Enter a 10-digit phone number" error={errors.phone?.message} {...register('phone')} />
              <div className="sm:col-span-2"><FormInput label="Address line" placeholder="House number and street name" autoComplete="street-address" error={errors.addressLine1?.message} {...register('addressLine1')} /></div>
              <FormInput label="City" placeholder="Enter the city or town" error={errors.city?.message} {...register('city')} />
              <label><span className="form-label">Province</span><select className="input-field" autoComplete="address-level1" {...register('province')}><option value="">Select a province</option>{SRI_LANKA_PROVINCE_NAMES.map((name) => <option key={name} value={name}>{name} Province</option>)}</select>{errors.province && <p className="mt-1 text-xs text-red-600">{errors.province.message}</p>}</label>
              <label><span className="form-label">District</span><select className="input-field disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-muted" autoComplete="address-level2" disabled={!province} {...register('district')}><option value="">{province ? 'Select a district' : 'Select a province first'}</option>{districts.map((name) => <option key={name} value={name}>{name}</option>)}</select>{errors.district && <p className="mt-1 text-xs text-red-600">{errors.district.message}</p>}</label>
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
