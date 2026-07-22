import { useEffect, useMemo, useState } from 'react'
import api from '../services/api.js'
import { BrandContext } from './BrandContext.js'

const defaults = {
  business: { name: 'Eshaz Dream World', tagline: 'Your Destination | My Passion', logo: { url: '' } },
  contact: {
    phone: '0750894221', phoneHref: 'tel:+94750894221', whatsapp: '0750894221',
    whatsappHref: 'https://wa.me/94750894221?text=Hello%20Eshaz%20Dream%20World%2C%20I%20would%20like%20to%20know%20more%20about%20your%20creations.',
    email: 'eshadreamworld22@gmail.com', emailHref: 'mailto:eshadreamworld22@gmail.com', location: 'View our location',
    mapsHref: 'https://www.google.com/maps?q=7.728977507983271,81.69298067448817',
    mapEmbedUrl: 'https://www.google.com/maps/embed?pb=!1m17!1m12!1m3!1d3577.7767937020376!2d81.69298067448817!3d7.728977507983271!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m2!1m1!2zN8KwNDMnNDQuMyJOIDgxwrA0MSc0NC4wIkU!5e1!3m2!1sen!2slk!4v1784549433627!5m2!1sen!2slk',
    instagram: 'https://www.instagram.com/eshazdreamworld?igsh=MXJ4Znd4N2dmNXBreg==',
    facebook: 'https://www.facebook.com/share/1GtwA5K8LB/',
    tiktok: 'https://www.tiktok.com/@eshazdreamworld?_r=1&_t=ZS-98EqzO3FHWC',
  },
  shipping: { standardFee: 450, expressFee: 900, pickupFee: 0, standardDays: 5, expressDays: 2, pickupDays: 1 },
  bankTransferAvailable: false,
}

function BrandProvider({ children }) {
  const [settings, setSettings] = useState(defaults)

  useEffect(() => {
    let active = true
    const load = () => api.get('/site-settings').then((response) => { if (active) setSettings(response.data.data.settings) }).catch(() => {})
    void load()
    window.addEventListener('edw:settings-updated', load)
    return () => { active = false; window.removeEventListener('edw:settings-updated', load) }
  }, [])

  const brand = useMemo(() => ({
    name: settings.business?.name || defaults.business.name,
    tagline: settings.business?.tagline || defaults.business.tagline,
    logo: settings.business?.logo || defaults.business.logo,
    contact: { ...defaults.contact, ...settings.contact },
    shipping: { ...defaults.shipping, ...settings.shipping },
    bankTransferAvailable: Boolean(settings.bankTransferAvailable),
  }), [settings])

  return <BrandContext.Provider value={brand}>{children}</BrandContext.Provider>
}

export default BrandProvider
