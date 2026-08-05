import { useMemo } from 'react'
import { FiFacebook, FiInstagram, FiMail, FiMapPin, FiMessageCircle, FiPhone } from 'react-icons/fi'
import { FaTiktok } from 'react-icons/fa'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import FormField from '../components/common/FormField.jsx'
import PageBanner from '../components/common/PageBanner.jsx'
import PageTransition from '../components/common/PageTransition.jsx'
import { useBrand } from '../hooks/useBrand.js'
import { useSeo } from '../hooks/useSeo.js'
import { brandLogo } from '../assets/images/index.js'
import api from '../services/api.js'
import { EMAIL_ERROR, PHONE_ERROR, emailPattern, normalizeEmailInput, normalizePhoneInput, phonePattern } from '../utils/inputValidation.js'
import { INDEX_ROBOTS, SITE_URL } from '../utils/seo.js'
import { SEO_KEYWORDS } from '../utils/seoKeywords.js'

function ContactPage() {
  const { name, logo, contact } = useBrand()
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm()
  const socialLinks = [
    { label: 'Instagram', href: contact.instagram, Icon: FiInstagram },
    { label: 'Facebook', href: contact.facebook, Icon: FiFacebook },
    { label: 'TikTok', href: contact.tiktok, Icon: FaTiktok },
  ].filter((item) => item.href)
  const structuredData = useMemo(() => ({
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'ContactPage',
        '@id': `${SITE_URL}/contact#page`,
        url: `${SITE_URL}/contact`,
        name: `Contact ${name}`,
        description: `Contact ${name} in Batticaloa for custom gifts, personalized bouquets, delivery, and online order enquiries across Sri Lanka.`,
        isPartOf: { '@id': `${SITE_URL}/#website` },
        about: { '@id': `${SITE_URL}/#store` },
        inLanguage: 'en-LK',
        mainEntity: {
          '@type': 'ContactPoint',
          telephone: contact.phoneHref?.replace('tel:', '') || contact.phone,
          email: contact.email,
          contactType: 'customer service',
          areaServed: ['Batticaloa', 'LK'],
        },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_URL}/` },
          { '@type': 'ListItem', position: 2, name: 'Contact', item: `${SITE_URL}/contact` },
        ],
      },
    ],
  }), [contact, name])
  useSeo({
    title: `Gift Delivery Batticaloa | Contact ${name}`,
    description: `Contact ${name} in Batticaloa by phone, email or WhatsApp for custom gifts, personalized bouquets, delivery and order enquiries across Sri Lanka.`,
    keywords: SEO_KEYWORDS.contact,
    canonicalPath: '/contact',
    image: logo?.url || brandLogo,
    imageAlt: `${name} logo`,
    robots: INDEX_ROBOTS,
    structuredData,
  })

  const submitContact = async (values) => {
    try {
      const response = await api.post('/communications/contact-messages', values)
      toast.success(response.data.message || 'Your message has been sent successfully.')
      reset()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to send your message. Please try again.')
    }
  }

  return (
    <PageTransition>
      <PageBanner eyebrow="Contact Our Gift Shop" title="Let’s Create Something Beautiful" description="Contact our Batticaloa gift shop by phone, email or WhatsApp for custom gifts, personalized bouquets and delivery enquiries." />
      <section className="section-shell py-12 sm:py-16">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { Icon: FiMessageCircle, title: 'WhatsApp', text: contact.whatsapp, href: contact.whatsappHref, external: true },
            { Icon: FiPhone, title: 'Phone', text: contact.phone, href: contact.phoneHref },
            { Icon: FiMail, title: 'Email', text: contact.email, href: contact.emailHref },
            { Icon: FiMapPin, title: 'Location', text: contact.location, href: contact.mapsHref, external: true },
          ].map(({ Icon, title, text, href, external }) => <a key={title} href={href} target={external ? '_blank' : undefined} rel={external ? 'noreferrer' : undefined} className="min-w-0 rounded-[1.5rem] border border-gold/15 bg-white p-6 text-left transition-transform hover:-translate-y-1"><span className="grid h-11 w-11 place-items-center rounded-full bg-pink-light text-rosewood"><Icon aria-hidden="true" /></span><span className="mt-4 block font-serif text-xl font-semibold text-ink">{title}</span><span className="mt-2 block break-words text-sm text-muted">{text}</span></a>)}
        </div>

        <div className="mt-12 grid overflow-hidden rounded-[2rem] border border-gold/15 bg-white lg:grid-cols-[1.1fr_0.9fr]">
          <div className="p-6 sm:p-10">
            <h2 className="font-serif text-3xl font-semibold text-ink sm:text-4xl">Send a Message</h2>
            <p className="mt-3 text-sm leading-7 text-muted">Required fields are marked with an asterisk.</p>
            <form onSubmit={handleSubmit(submitContact)} className="mt-8 grid gap-5 sm:grid-cols-2" noValidate>
              <FormField label="Full Name" name="fullName" register={register} rules={{ required: 'Full name is required.', minLength: { value: 2, message: 'Please enter at least 2 characters.' } }} error={errors.fullName} placeholder="Your full name" />
              <FormField label="Email" name="email" type="email" autoComplete="email" register={register} rules={{ required: 'Email is required.', setValueAs: normalizeEmailInput, pattern: { value: emailPattern, message: EMAIL_ERROR }, maxLength: { value: 160, message: 'Email address is too long.' } }} error={errors.email} placeholder="you@example.com" />
              <FormField label="Phone Number" name="phone" type="tel" inputMode="numeric" maxLength={10} autoComplete="tel" register={register} rules={{ required: 'Phone number is required.', setValueAs: normalizePhoneInput, pattern: { value: phonePattern, message: PHONE_ERROR } }} error={errors.phone} placeholder="Enter your 10-digit phone number" />
              <FormField label="Subject" name="subject" register={register} rules={{ required: 'Subject is required.', minLength: { value: 3, message: 'Please enter at least 3 characters.' }, maxLength: { value: 120, message: 'Subject is too long.' } }} error={errors.subject} placeholder="How can we help?" />
              <div className="sm:col-span-2"><FormField label="Message" name="message" type="textarea" register={register} rules={{ required: 'Message is required.', minLength: { value: 20, message: 'Please write at least 20 characters.' }, maxLength: { value: 2000, message: 'Message must be 2,000 characters or fewer.' } }} error={errors.message} placeholder="Tell us about your question or idea…" /></div>
              <div className="sm:col-span-2"><button type="submit" disabled={isSubmitting} className="primary-button px-8 disabled:cursor-not-allowed disabled:opacity-60">{isSubmitting ? 'Sending Message…' : 'Send Message'}</button></div>
            </form>
          </div>
          <div className="flex min-h-[28rem] flex-col bg-gradient-to-br from-pink-light via-lavender/45 to-blue-light p-5 sm:p-7">
            <div className="mb-5"><p className="text-xs font-semibold uppercase tracking-[0.25em] text-gold">Visit us</p><h2 className="mt-2 font-serif text-3xl font-semibold text-ink">Find Eshaz Dream World</h2></div>
            <div className="min-h-72 flex-1 overflow-hidden rounded-[1.5rem] border border-white/60 bg-white shadow-luxury">
              <iframe src={contact.mapEmbedUrl} title="Eshaz Dream World location on Google Maps" className="h-full min-h-72 w-full border-0" allowFullScreen loading="lazy" referrerPolicy="strict-origin-when-cross-origin" />
            </div>
            <div className="mt-5 flex flex-wrap items-center justify-between gap-3"><a href={contact.mapsHref} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-rosewood hover:underline">Open in Google Maps</a><div className="flex gap-2">{socialLinks.map(({ label, href, Icon }) => <a key={label} href={href} target="_blank" rel="noopener noreferrer" className="icon-button bg-white" aria-label={`Follow Eshaz Dream World on ${label}`}><Icon aria-hidden="true" /></a>)}</div></div>
          </div>
        </div>
      </section>
    </PageTransition>
  )
}

export default ContactPage
