import SiteSetting from '../models/SiteSetting.js'

const envValue = (key) => String(process.env[key] || '').trim()

export function defaultSiteSettings() {
  return {
    business: { name: 'Eshaz Dream World', tagline: 'Your Destination | My Passion', logo: { url: '', publicId: '', width: 0, height: 0, bytes: 0, storage: '' } },
    contact: {
      phone: '0750894221', whatsapp: '0750894221', email: 'eshazdreamworld@gmail.com', location: 'View our location',
      mapsHref: 'https://www.google.com/maps?q=7.728977507983271,81.69298067448817',
      mapEmbedUrl: 'https://www.google.com/maps/embed?pb=!1m17!1m12!1m3!1d3577.7767937020376!2d81.69298067448817!3d7.728977507983271!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m2!1m1!2zN8KwNDMnNDQuMyJOIDgxwrA0MSc0NC4wIkU!5e1!3m2!1sen!2slk!4v1784549433627!5m2!1sen!2slk',
      instagram: 'https://www.instagram.com/eshazdreamworld?igsh=MXJ4Znd4N2dmNXBreg==',
      facebook: 'https://www.facebook.com/share/1GtwA5K8LB/',
      tiktok: 'https://www.tiktok.com/@eshazdreamworld?_r=1&_t=ZS-98EqzO3FHWC',
    },
    bank: {
      bankName: envValue('BANK_NAME'), accountName: envValue('BANK_ACCOUNT_NAME'), accountNumber: envValue('BANK_ACCOUNT_NUMBER'),
      branch: envValue('BANK_BRANCH'), branchCode: envValue('BANK_BRANCH_CODE'), instructions: envValue('BANK_TRANSFER_INSTRUCTIONS'),
    },
    shipping: { standardFee: 450, expressFee: 900, pickupFee: 0, standardDays: 5, expressDays: 2, pickupDays: 1 },
  }
}

export async function getResolvedSiteSettings() {
  const stored = await SiteSetting.findOne({ key: 'store' }).lean()
  if (!stored) return { ...defaultSiteSettings(), exists: false }
  const defaults = defaultSiteSettings()
  return { business: { ...defaults.business, ...stored.business }, contact: { ...defaults.contact, ...stored.contact }, bank: { ...defaults.bank, ...stored.bank }, shipping: { ...defaults.shipping, ...stored.shipping }, exists: true, id: String(stored._id), updatedAt: stored.updatedAt }
}

const digits = (value) => String(value || '').replace(/\D/g, '')
const sriLankanInternational = (value) => {
  const phone = digits(value)
  if (phone.startsWith('94')) return phone
  return phone.startsWith('0') ? `94${phone.slice(1)}` : phone
}

export function publicSiteSettings(settings) {
  const phoneDigits = digits(settings.contact.phone)
  const whatsappDigits = sriLankanInternational(settings.contact.whatsapp)
  return {
    business: settings.business,
    contact: {
      ...settings.contact,
      phoneHref: `tel:${phoneDigits.startsWith('0') ? `+94${phoneDigits.slice(1)}` : `+${phoneDigits}`}`,
      whatsappHref: `https://wa.me/${whatsappDigits}?text=Hello%20Eshaz%20Dream%20World%2C%20I%20would%20like%20to%20know%20more%20about%20your%20creations.`,
      emailHref: `mailto:${settings.contact.email}`,
    },
    shipping: settings.shipping,
    bankTransferAvailable: Boolean(settings.bank.bankName && settings.bank.accountName && settings.bank.accountNumber && settings.bank.branch),
  }
}
