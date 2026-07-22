import { useCallback, useEffect, useMemo, useState } from 'react'
import { FiCreditCard, FiImage, FiMail, FiMapPin, FiPhone, FiRefreshCw, FiSave, FiShoppingBag, FiTrash2, FiTruck } from 'react-icons/fi'
import { FaFacebook, FaInstagram, FaTiktok, FaWhatsapp } from 'react-icons/fa'
import toast from 'react-hot-toast'
import { Link } from 'react-router-dom'
import AdminPageHeader from '../../components/admin/AdminPageHeader.jsx'
import ConfirmModal from '../../components/common/ConfirmModal.jsx'
import LoadingButton from '../../components/common/LoadingButton.jsx'
import { adminApi, uploadSingleImage } from '../../services/adminApi.js'
import { EMAIL_ERROR, PHONE_ERROR, isValidEmailAddress, isValidPhoneNumber, normalizeEmailInput, normalizePhoneInput } from '../../utils/inputValidation.js'

const emptySettings = {
  business: { name: '', tagline: '', logo: { url: '', publicId: '' } },
  contact: { phone: '', whatsapp: '', email: '', location: '', mapsHref: '', mapEmbedUrl: '', instagram: '', facebook: '', tiktok: '' },
  bank: { bankName: '', accountName: '', accountNumber: '', branch: '', branchCode: '', instructions: '' },
  shipping: { standardFee: 450, expressFee: 900, pickupFee: 0, standardDays: 5, expressDays: 2, pickupDays: 1 },
  exists: false,
}

const validSocialUrl = (value, platformHost) => {
  if (!String(value || '').trim()) return true
  try {
    const parsed = new URL(value)
    const hostname = parsed.hostname.toLowerCase().replace(/^www\./, '')
    return parsed.protocol === 'https:' && (hostname === platformHost || hostname.endsWith(`.${platformHost}`))
  } catch { return false }
}

function Field({ label, value, onChange, type = 'text', required = false, placeholder = '', min, max, step, maxLength, inputMode, autoComplete, error }) {
  return <label className="block"><span className="form-label">{label}{required && ' *'}</span><input className={`input-field ${error ? 'border-red-400' : ''}`} type={type} value={value ?? ''} onChange={(event) => onChange(event.target.value)} required={required} placeholder={placeholder} min={min} max={max} step={step} maxLength={maxLength} inputMode={inputMode} autoComplete={autoComplete} aria-invalid={Boolean(error)} />{error && <span className="mt-1.5 block text-xs text-red-600">{error}</span>}</label>
}

function SectionSaveButton({ section, label, savingSection, onSave }) {
  return <div className="mt-6 flex justify-end border-t border-gold/10 pt-5"><LoadingButton type="button" loading={savingSection === section} disabled={Boolean(savingSection)} className="primary-button" onClick={() => onSave(section, label)}><FiSave /> Save {label}</LoadingButton></div>
}

function AdminSettingsPage() {
  const [settings, setSettings] = useState(emptySettings)
  const [persistedSettings, setPersistedSettings] = useState(emptySettings)
  const [loading, setLoading] = useState(true)
  const [savingSection, setSavingSection] = useState('')
  const [logoFile, setLogoFile] = useState(null)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [fieldErrors, setFieldErrors] = useState({})
  const logoPreview = useMemo(() => logoFile ? URL.createObjectURL(logoFile) : settings.business?.logo?.url, [logoFile, settings.business?.logo?.url])
  useEffect(() => () => { if (logoFile && logoPreview) URL.revokeObjectURL(logoPreview) }, [logoFile, logoPreview])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const loaded = await adminApi.getSettings()
      setSettings(loaded)
      setPersistedSettings(loaded)
      setLogoFile(null)
      setFieldErrors({})
    }
    catch (error) { toast.error(error.response?.data?.message || 'Unable to load website settings.') }
    finally { setLoading(false) }
  }, [])
  useEffect(() => { void load() }, [load])

  const change = (section, field, value) => {
    setSettings((current) => ({ ...current, [section]: { ...current[section], [field]: value } }))
    setFieldErrors((current) => ({ ...current, [`${section}.${field}`]: '' }))
  }
  const buildPayload = (section, logo) => {
    const business = section === 'business' ? { ...settings.business, logo } : persistedSettings.business
    const contact = { ...persistedSettings.contact }
    if (section === 'contact') {
      Object.assign(contact, {
        phone: normalizePhoneInput(settings.contact.phone), whatsapp: normalizePhoneInput(settings.contact.whatsapp),
        email: normalizeEmailInput(settings.contact.email), location: settings.contact.location,
        mapsHref: settings.contact.mapsHref, mapEmbedUrl: settings.contact.mapEmbedUrl,
      })
    }
    if (section === 'social') Object.assign(contact, { instagram: settings.contact.instagram, facebook: settings.contact.facebook, tiktok: settings.contact.tiktok })
    const bank = section === 'bank' ? settings.bank : persistedSettings.bank
    const shippingSource = section === 'shipping' ? settings.shipping : persistedSettings.shipping
    const shipping = Object.fromEntries(Object.entries(shippingSource).map(([key, value]) => [key, Number(value)]))
    return { business, contact, bank, shipping }
  }

  const validateSection = (section) => {
    const validationErrors = {}
    if (section === 'business' && settings.business.name.trim().length < 2) validationErrors['business.name'] = 'Business name must contain at least 2 characters.'
    if (section === 'contact') {
      if (!isValidPhoneNumber(settings.contact.phone)) validationErrors['contact.phone'] = PHONE_ERROR
      if (!isValidPhoneNumber(settings.contact.whatsapp)) validationErrors['contact.whatsapp'] = PHONE_ERROR
      if (!isValidEmailAddress(settings.contact.email)) validationErrors['contact.email'] = EMAIL_ERROR
    }
    if (section === 'social') {
      if (!validSocialUrl(settings.contact.instagram, 'instagram.com')) validationErrors['contact.instagram'] = 'Enter an official https://instagram.com link.'
      if (!validSocialUrl(settings.contact.facebook, 'facebook.com')) validationErrors['contact.facebook'] = 'Enter an official https://facebook.com link.'
      if (!validSocialUrl(settings.contact.tiktok, 'tiktok.com')) validationErrors['contact.tiktok'] = 'Enter an official https://tiktok.com link.'
    }
    if (section === 'bank') {
      const required = [settings.bank.bankName, settings.bank.accountName, settings.bank.accountNumber, settings.bank.branch]
      if (required.some((value) => value.trim()) && !required.every((value) => value.trim())) validationErrors.bank = 'Complete bank name, account holder, account number, and branch together.'
    }
    if (Object.keys(validationErrors).length) {
      setFieldErrors(validationErrors)
      toast.error('Please correct the highlighted fields.')
      return false
    }
    setFieldErrors({})
    return true
  }

  const mergeSavedSection = (current, updated, section) => {
    const next = { ...current, exists: true }
    if (section === 'business') next.business = updated.business
    if (section === 'contact') next.contact = { ...current.contact, phone: updated.contact.phone, whatsapp: updated.contact.whatsapp, email: updated.contact.email, location: updated.contact.location, mapsHref: updated.contact.mapsHref, mapEmbedUrl: updated.contact.mapEmbedUrl }
    if (section === 'social') next.contact = { ...current.contact, instagram: updated.contact.instagram, facebook: updated.contact.facebook, tiktok: updated.contact.tiktok }
    if (section === 'bank') next.bank = updated.bank
    if (section === 'shipping') next.shipping = updated.shipping
    return next
  }

  const saveSection = async (section, label) => {
    if (!validateSection(section)) return
    setSavingSection(section)
    try {
      const logo = section === 'business' && logoFile ? await uploadSingleImage(logoFile, 'settings') : (section === 'business' ? settings.business.logo : persistedSettings.business.logo)
      const body = buildPayload(section, logo)
      const updated = persistedSettings.exists ? await adminApi.updateSettings(body) : await adminApi.createSettings(body)
      const saved = { ...updated, exists: true }
      setPersistedSettings(saved)
      setSettings((current) => mergeSavedSection(current, saved, section))
      if (section === 'business') setLogoFile(null)
      window.dispatchEvent(new Event('edw:settings-updated'))
      toast.success(`${label} saved successfully.`)
    } catch (error) {
      const issues = error.response?.data?.errors || []
      if (issues.length) setFieldErrors(Object.fromEntries(issues.map((issue) => [issue.field, issue.message])))
      const detail = issues[0]?.message
      toast.error(detail || error.response?.data?.message || `Unable to save ${label.toLowerCase()}.`)
    } finally { setSavingSection('') }
  }

  const remove = async () => {
    setSavingSection('delete')
    try {
      const restored = await adminApi.deleteSettings()
      const defaults = { ...restored, exists: false }
      setSettings(defaults); setPersistedSettings(defaults); setLogoFile(null); setDeleteOpen(false)
      window.dispatchEvent(new Event('edw:settings-updated'))
      toast.success('Saved settings deleted. Safe website defaults are active again.')
    } catch (error) { toast.error(error.response?.data?.message || 'Unable to delete website settings.') }
    finally { setSavingSection('') }
  }

  if (loading) return <p className="p-10 text-center text-muted">Loading website settings…</p>
  return <div className="space-y-7">
    <AdminPageHeader title="Website Settings" description="Create, view, update, or delete the owner details, payment account, delivery pricing, branding, and storefront content." action={<button type="button" className="secondary-button" onClick={load}><FiRefreshCw /> Refresh</button>} />

    <form onSubmit={(event) => event.preventDefault()} className="space-y-7" noValidate>
      <section className="form-section">
        <div className="flex items-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-xl bg-pink-light text-rosewood"><FiShoppingBag /></span><div><h2 className="font-serif text-2xl font-semibold">Business & Brand</h2><p className="text-sm text-muted">Used in the header, footer, homepage, contact details, and invoices.</p></div></div>
        <div className="mt-6 grid gap-5 md:grid-cols-2"><Field label="Business name" value={settings.business.name} onChange={(value) => change('business', 'name', value)} required maxLength={120} error={fieldErrors['business.name']} /><Field label="Tagline" value={settings.business.tagline} onChange={(value) => change('business', 'tagline', value)} maxLength={180} /><label className="md:col-span-2"><span className="form-label">Website logo</span><div className="mt-2 flex flex-wrap items-center gap-5 rounded-2xl border border-gold/15 p-4">{logoPreview ? <img src={logoPreview} alt="Logo preview" className="h-24 w-24 rounded-full bg-cream object-contain" /> : <span className="grid h-24 w-24 place-items-center rounded-full bg-cream text-xs text-muted">Default logo</span>}<div className="flex-1"><input type="file" accept="image/*,.heic,.heif" className="input-field py-3" onChange={(event) => setLogoFile(event.target.files?.[0] || null)} /><p className="mt-2 text-xs text-muted">Upload from phone or computer. The image is compressed automatically.</p></div></div></label></div>
        <SectionSaveButton section="business" label="Business & Brand" savingSection={savingSection} onSave={saveSection} />
      </section>

      <section className="form-section">
        <div className="flex items-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-xl bg-pink-light text-rosewood"><FiPhone /></span><div><h2 className="font-serif text-2xl font-semibold">Owner Contact Details</h2><p className="text-sm text-muted">Updates the footer, Contact page, phone links, and WhatsApp button.</p></div></div>
        <div className="mt-6 grid gap-5 md:grid-cols-2"><Field label="Phone number" type="tel" inputMode="numeric" autoComplete="tel" maxLength={10} value={settings.contact.phone} onChange={(value) => change('contact', 'phone', value)} required error={fieldErrors['contact.phone']} /><Field label="WhatsApp number" type="tel" inputMode="numeric" maxLength={10} value={settings.contact.whatsapp} onChange={(value) => change('contact', 'whatsapp', value)} required error={fieldErrors['contact.whatsapp']} /><Field label="Email address" type="email" inputMode="email" autoComplete="email" maxLength={160} value={settings.contact.email} onChange={(value) => change('contact', 'email', value)} required error={fieldErrors['contact.email']} /><Field label="Location label" value={settings.contact.location} onChange={(value) => change('contact', 'location', value)} /><Field label="Google Maps link" type="url" value={settings.contact.mapsHref} onChange={(value) => change('contact', 'mapsHref', value)} placeholder="https://…" /><Field label="Google Maps embed URL" type="url" value={settings.contact.mapEmbedUrl} onChange={(value) => change('contact', 'mapEmbedUrl', value)} placeholder="https://www.google.com/maps/embed?…" /></div>
        <div className="mt-5 flex flex-wrap gap-3 text-xs text-muted"><span className="inline-flex items-center gap-2"><FaWhatsapp /> WhatsApp storefront button</span><span className="inline-flex items-center gap-2"><FiMail /> Contact email</span><span className="inline-flex items-center gap-2"><FiMapPin /> Store map</span></div>
        <SectionSaveButton section="contact" label="Contact Details" savingSection={savingSection} onSave={saveSection} />
      </section>

      <section className="form-section">
        <div className="flex items-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-xl bg-pink-light text-rosewood"><FaInstagram /></span><div><h2 className="font-serif text-2xl font-semibold">Social Media Links</h2><p className="text-sm text-muted">These links power the Instagram, Facebook, and TikTok buttons in the footer and Contact page.</p></div></div>
        <div className="mt-6 grid gap-5 lg:grid-cols-3"><Field label="Instagram URL" type="url" maxLength={1200} value={settings.contact.instagram || ''} onChange={(value) => change('contact', 'instagram', value)} placeholder="https://www.instagram.com/…" error={fieldErrors['contact.instagram']} /><Field label="Facebook URL" type="url" maxLength={1200} value={settings.contact.facebook || ''} onChange={(value) => change('contact', 'facebook', value)} placeholder="https://www.facebook.com/…" error={fieldErrors['contact.facebook']} /><Field label="TikTok URL" type="url" maxLength={1200} value={settings.contact.tiktok || ''} onChange={(value) => change('contact', 'tiktok', value)} placeholder="https://www.tiktok.com/@…" error={fieldErrors['contact.tiktok']} /></div>
        <div className="mt-5 flex flex-wrap gap-4 text-xs text-muted"><span className="inline-flex items-center gap-2"><FaInstagram /> Instagram</span><span className="inline-flex items-center gap-2"><FaFacebook /> Facebook</span><span className="inline-flex items-center gap-2"><FaTiktok /> TikTok</span></div>
        <SectionSaveButton section="social" label="Social Media Links" savingSection={savingSection} onSave={saveSection} />
      </section>

      <section className="form-section">
        <div className="flex items-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-xl bg-pink-light text-rosewood"><FiCreditCard /></span><div><h2 className="font-serif text-2xl font-semibold">Online Bank Transfer</h2><p className="text-sm text-muted">Customers see these details only when all four required account fields are completed.</p></div></div>
        <div className="mt-6 grid gap-5 md:grid-cols-2"><Field label="Bank name" value={settings.bank.bankName} onChange={(value) => change('bank', 'bankName', value)} /><Field label="Account holder name" value={settings.bank.accountName} onChange={(value) => change('bank', 'accountName', value)} /><Field label="Account number" value={settings.bank.accountNumber} onChange={(value) => change('bank', 'accountNumber', value)} /><Field label="Branch" value={settings.bank.branch} onChange={(value) => change('bank', 'branch', value)} /><Field label="Branch code" value={settings.bank.branchCode} onChange={(value) => change('bank', 'branchCode', value)} /><label><span className="form-label">Transfer instructions</span><textarea className="input-field min-h-24" maxLength="600" value={settings.bank.instructions} onChange={(event) => change('bank', 'instructions', event.target.value)} /></label></div>
        {fieldErrors.bank && <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{fieldErrors.bank}</p>}
        <SectionSaveButton section="bank" label="Bank Transfer Details" savingSection={savingSection} onSave={saveSection} />
      </section>

      <section className="form-section">
        <div className="flex items-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-xl bg-pink-light text-rosewood"><FiTruck /></span><div><h2 className="font-serif text-2xl font-semibold">Delivery Fees & Times</h2><p className="text-sm text-muted">These server-controlled values are used to calculate every checkout total.</p></div></div>
        <div className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-3"><Field label="Standard fee (LKR)" type="number" min="0" step="0.01" value={settings.shipping.standardFee} onChange={(value) => change('shipping', 'standardFee', value)} required error={fieldErrors['shipping.standardFee']} /><Field label="Express fee (LKR)" type="number" min="0" step="0.01" value={settings.shipping.expressFee} onChange={(value) => change('shipping', 'expressFee', value)} required error={fieldErrors['shipping.expressFee']} /><Field label="Pickup fee (LKR)" type="number" min="0" step="0.01" value={settings.shipping.pickupFee} onChange={(value) => change('shipping', 'pickupFee', value)} required error={fieldErrors['shipping.pickupFee']} /><Field label="Standard delivery days" type="number" min="1" max="30" value={settings.shipping.standardDays} onChange={(value) => change('shipping', 'standardDays', value)} required error={fieldErrors['shipping.standardDays']} /><Field label="Express delivery days" type="number" min="1" max="30" value={settings.shipping.expressDays} onChange={(value) => change('shipping', 'expressDays', value)} required error={fieldErrors['shipping.expressDays']} /><Field label="Pickup preparation days" type="number" min="1" max="30" value={settings.shipping.pickupDays} onChange={(value) => change('shipping', 'pickupDays', value)} required error={fieldErrors['shipping.pickupDays']} /></div>
        <SectionSaveButton section="shipping" label="Delivery Fees & Times" savingSection={savingSection} onSave={saveSection} />
      </section>

      {settings.exists && <div className="flex justify-end"><button type="button" className="secondary-button text-red-600" disabled={Boolean(savingSection)} onClick={() => setDeleteOpen(true)}><FiTrash2 /> Delete All Saved Settings</button></div>}
    </form>

    <section className="form-section"><div className="flex items-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-xl bg-pink-light text-rosewood"><FiImage /></span><div><h2 className="font-serif text-2xl font-semibold">Website Content & Homepage Images</h2><p className="text-sm text-muted">The existing CRUD managers control every image-driven homepage area.</p></div></div><div className="mt-6 grid gap-4 md:grid-cols-3"><Link to="/admin/banners" className="rounded-2xl border border-gold/15 p-5 transition hover:border-rosewood"><strong>Homepage Images</strong><p className="mt-2 text-sm text-muted">Hero, promotional, and gallery images with simple full CRUD.</p></Link><Link to="/admin/categories" className="rounded-2xl border border-gold/15 p-5 transition hover:border-rosewood"><strong>Category Images</strong><p className="mt-2 text-sm text-muted">Images displayed in “Shop by Category,” including names and descriptions.</p></Link><Link to="/admin/products" className="rounded-2xl border border-gold/15 p-5 transition hover:border-rosewood"><strong>Product Images</strong><p className="mt-2 text-sm text-muted">Featured creations, new arrivals, product cards, prices, and descriptions.</p></Link></div></section>

    <ConfirmModal open={deleteOpen} title="Delete all saved website settings?" message="The database record will be deleted and safe built-in defaults will immediately become active. Products, orders, and homepage content will not be deleted." confirmLabel="Delete Settings" onClose={() => setDeleteOpen(false)} onConfirm={remove} loading={savingSection === 'delete'} />
  </div>
}

export default AdminSettingsPage
