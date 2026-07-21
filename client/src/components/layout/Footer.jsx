import { FiFacebook, FiInstagram, FiMail, FiMapPin, FiPhone } from 'react-icons/fi'
import { FaWhatsapp } from 'react-icons/fa'
import toast from 'react-hot-toast'
import { Link } from 'react-router-dom'
import { footerGroups } from '../../data/navigation.js'
import { useBrand } from '../../hooks/useBrand.js'
import Logo from './Logo.jsx'

function Footer() {
  const { name, tagline } = useBrand()
  const socialPlaceholder = () => toast('Add your official social media link to activate this button.')

  return (
    <footer className="border-t border-gold/15 bg-[#30242b] text-white/75">
      <div className="section-shell grid gap-10 py-16 sm:grid-cols-2 lg:grid-cols-[1.25fr_repeat(3,0.8fr)_1.1fr]">
        <div>
          <Logo size="large" />
          <h2 className="mt-4 font-serif text-2xl text-white">{name}</h2>
          <p className="mt-1 text-xs font-medium uppercase tracking-[0.2em] text-pink-primary">{tagline}</p>
          <p className="mt-5 max-w-xs text-sm leading-7">Customized bouquets, thoughtful gifts and creative designs made with love for every special moment.</p>
          <div className="mt-5 flex gap-2">
            {[{ label: 'Instagram', Icon: FiInstagram }, { label: 'Facebook', Icon: FiFacebook }].map(({ label, Icon }) => (
              <button key={label} type="button" onClick={socialPlaceholder} className="grid h-10 w-10 place-items-center rounded-full border border-white/15 transition-colors hover:border-pink-primary hover:text-pink-primary" aria-label={label}>
                <Icon aria-hidden="true" />
              </button>
            ))}
          </div>
        </div>

        {footerGroups.map((group) => (
          <div key={group.title}>
            <h3 className="font-serif text-lg text-white">{group.title}</h3>
            <ul className="mt-5 space-y-3 text-sm">
              {group.links.map((link) => (
                <li key={link.label}><Link to={link.to} className="transition-colors hover:text-pink-primary">{link.label}</Link></li>
              ))}
            </ul>
          </div>
        ))}

        <div>
          <h3 className="font-serif text-lg text-white">Contact</h3>
          <ul className="mt-5 space-y-4 text-sm">
            <li className="flex gap-3"><FaWhatsapp className="mt-1 shrink-0 text-pink-primary" aria-hidden="true" /><span>WhatsApp: Add your WhatsApp number</span></li>
            <li className="flex gap-3"><FiPhone className="mt-1 shrink-0 text-pink-primary" aria-hidden="true" /><span>Phone: Add your phone number</span></li>
            <li className="flex gap-3"><FiMail className="mt-1 shrink-0 text-pink-primary" aria-hidden="true" /><span>Email: Add your email address</span></li>
            <li className="flex gap-3"><FiMapPin className="mt-1 shrink-0 text-pink-primary" aria-hidden="true" /><span>Batticaloa, Sri Lanka</span></li>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="section-shell flex flex-col items-center justify-between gap-3 py-5 text-center text-xs sm:flex-row sm:text-left">
          <p>&copy; {new Date().getFullYear()} {name}. Designed with love for Eshaz Dream World.</p>
          <span className="rounded-full border border-white/15 px-3 py-1.5">Secure card payments with Stripe · Cash on Delivery</span>
        </div>
      </div>
    </footer>
  )
}

export default Footer
