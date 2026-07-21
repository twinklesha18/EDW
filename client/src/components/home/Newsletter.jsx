import { useState } from 'react'
import { FiMail } from 'react-icons/fi'
import toast from 'react-hot-toast'

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function Newsletter() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')

  const subscribe = (event) => {
    event.preventDefault()
    const value = email.trim()
    if (!value) { setError('Please enter your email address.'); return }
    if (!emailPattern.test(value)) { setError('Please enter a valid email address.'); return }
    setError('')
    setEmail('')
    toast.success('Thank you for joining Eshaz Dream World.')
  }

  return (
    <section className="section-shell py-16 sm:py-20">
      <div className="relative isolate overflow-hidden rounded-[2.25rem] border border-gold/20 bg-gradient-to-br from-pink-light via-white to-blue-light px-6 py-12 text-center sm:px-12 sm:py-16">
        <div className="fine-grid absolute inset-0 -z-10 opacity-30" />
        <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-white text-rosewood shadow-sm"><FiMail aria-hidden="true" /></span>
        <h2 className="mt-5 font-serif text-4xl font-semibold text-ink sm:text-5xl">Join Our Dream World</h2>
        <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-muted">Be the first to know about new collections, offers and creative gift ideas.</p>
        <form onSubmit={subscribe} className="mx-auto mt-7 max-w-xl" noValidate>
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="flex-1 text-left">
              <label htmlFor="newsletter-email" className="sr-only">Email address</label>
              <input id="newsletter-email" type="email" value={email} onChange={(event) => { setEmail(event.target.value); setError('') }} className="input-field bg-white" placeholder="Email address" aria-invalid={Boolean(error)} aria-describedby={error ? 'newsletter-error' : undefined} />
            </div>
            <button type="submit" className="primary-button px-7">Subscribe</button>
          </div>
          {error && <p id="newsletter-error" className="mt-2 text-left text-xs text-red-600">{error}</p>}
        </form>
      </div>
    </section>
  )
}

export default Newsletter
