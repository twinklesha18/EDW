import { FiFacebook, FiInstagram, FiMail, FiMapPin, FiMessageCircle, FiPhone } from 'react-icons/fi'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import FormField from '../components/common/FormField.jsx'
import PageBanner from '../components/common/PageBanner.jsx'
import PageTransition from '../components/common/PageTransition.jsx'
import { useDocumentTitle } from '../hooks/useDocumentTitle.js'

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function ContactPage() {
  useDocumentTitle('Contact | Eshaz Dream World')
  const { register, handleSubmit, reset, formState: { errors } } = useForm()
  const placeholderAction = () => toast('Add your official contact detail to activate this option.')

  const submitContact = () => {
    toast.success('Your message has been prepared successfully.')
    reset()
  }

  return (
    <PageTransition>
      <PageBanner eyebrow="Contact" title="Let’s Create Something Beautiful" description="Share your question or idea. This Phase 2 form validates locally and will be connected to delivery in a later phase." />
      <section className="section-shell py-12 sm:py-16">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { Icon: FiMessageCircle, title: 'WhatsApp', text: 'Add your WhatsApp number' },
            { Icon: FiPhone, title: 'Phone', text: 'Add your phone number' },
            { Icon: FiMail, title: 'Email', text: 'Add your email address' },
            { Icon: FiMapPin, title: 'Location', text: 'Batticaloa, Sri Lanka' },
          ].map(({ Icon, title, text }) => <button key={title} type="button" onClick={placeholderAction} className="rounded-[1.5rem] border border-gold/15 bg-white p-6 text-left transition-transform hover:-translate-y-1"><span className="grid h-11 w-11 place-items-center rounded-full bg-pink-light text-rosewood"><Icon aria-hidden="true" /></span><span className="mt-4 block font-serif text-xl font-semibold text-ink">{title}</span><span className="mt-2 block text-sm text-muted">{text}</span></button>)}
        </div>

        <div className="mt-12 grid overflow-hidden rounded-[2rem] border border-gold/15 bg-white lg:grid-cols-[1.1fr_0.9fr]">
          <div className="p-6 sm:p-10">
            <h2 className="font-serif text-3xl font-semibold text-ink sm:text-4xl">Send a Message</h2>
            <p className="mt-3 text-sm leading-7 text-muted">Required fields are marked with an asterisk.</p>
            <form onSubmit={handleSubmit(submitContact)} className="mt-8 grid gap-5 sm:grid-cols-2" noValidate>
              <FormField label="Full Name" name="fullName" register={register} rules={{ required: 'Full name is required.', minLength: { value: 2, message: 'Please enter at least 2 characters.' } }} error={errors.fullName} placeholder="Your full name" />
              <FormField label="Email" name="email" type="email" register={register} rules={{ required: 'Email is required.', pattern: { value: emailPattern, message: 'Enter a valid email address.' } }} error={errors.email} placeholder="you@example.com" />
              <FormField label="Phone Number" name="phone" type="tel" register={register} rules={{ required: 'Phone number is required.', minLength: { value: 7, message: 'Enter a valid phone number.' } }} error={errors.phone} placeholder="Your phone number" />
              <FormField label="Subject" name="subject" register={register} rules={{ required: 'Subject is required.' }} error={errors.subject} placeholder="How can we help?" />
              <div className="sm:col-span-2"><FormField label="Message" name="message" type="textarea" register={register} rules={{ required: 'Message is required.', minLength: { value: 20, message: 'Please write at least 20 characters.' } }} error={errors.message} placeholder="Tell us about your question or idea…" /></div>
              <div className="sm:col-span-2"><button type="submit" className="primary-button px-8">Prepare Message</button></div>
            </form>
          </div>
          <div className="flex min-h-80 flex-col justify-between bg-gradient-to-br from-pink-light via-lavender/45 to-blue-light p-8 sm:p-10">
            <div><p className="text-xs font-semibold uppercase tracking-[0.25em] text-gold">Visit us</p><h2 className="mt-4 font-serif text-3xl font-semibold text-ink">Location Map Placeholder</h2><p className="mt-4 text-sm leading-7 text-muted">Add the confirmed business address and embedded map before launch. Current location: Batticaloa, Sri Lanka.</p></div>
            <div className="mt-10"><p className="text-sm font-semibold text-ink">Follow our creative journey</p><div className="mt-3 flex gap-2"><button type="button" onClick={placeholderAction} className="icon-button bg-white" aria-label="Instagram"><FiInstagram aria-hidden="true" /></button><button type="button" onClick={placeholderAction} className="icon-button bg-white" aria-label="Facebook"><FiFacebook aria-hidden="true" /></button></div></div>
          </div>
        </div>
      </section>
    </PageTransition>
  )
}

export default ContactPage
