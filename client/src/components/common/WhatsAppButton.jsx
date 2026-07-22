import { FaWhatsapp } from 'react-icons/fa'
import { useBrand } from '../../hooks/useBrand.js'

function WhatsAppButton() {
  const { contact } = useBrand()

  return (
    <a
      href={contact.whatsappHref}
      target="_blank"
      rel="noreferrer"
      className="fixed bottom-5 right-4 z-40 grid h-12 w-12 place-items-center rounded-full bg-[#25D366] text-white shadow-[0_12px_30px_-10px_rgba(37,211,102,0.7)] transition-transform hover:-translate-y-1 sm:right-6"
      aria-label={`Contact Eshaz Dream World on WhatsApp at ${contact.whatsapp}`}
    >
      <FaWhatsapp size={23} aria-hidden="true" />
    </a>
  )
}

export default WhatsAppButton
