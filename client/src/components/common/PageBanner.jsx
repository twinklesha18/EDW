import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'

function PageBanner({ eyebrow, title, description }) {
  return (
    <section className="relative isolate overflow-hidden border-b border-gold/15 bg-gradient-to-br from-pink-light via-cream to-blue-light px-4 py-12 sm:px-8 sm:py-20 lg:px-12">
      <div className="fine-grid absolute inset-0 -z-10 opacity-40" />
      <div className="absolute -left-20 -top-20 -z-10 h-64 w-64 rounded-full bg-pink-primary/30 blur-3xl" />
      <div className="absolute -bottom-24 right-0 -z-10 h-72 w-72 rounded-full bg-lavender/50 blur-3xl" />
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-auto max-w-4xl text-center"
      >
        <div className="mb-4 flex items-center justify-center gap-2 text-xs font-medium text-muted">
          <Link to="/" className="transition-colors hover:text-rosewood">Home</Link>
          <span aria-hidden="true">/</span>
          <span>{eyebrow || title}</span>
        </div>
        <h1 className="break-words font-serif text-4xl font-semibold leading-tight text-ink sm:text-6xl">{title}</h1>
        {description && <p className="mx-auto mt-5 max-w-2xl leading-7 text-muted">{description}</p>}
      </motion.div>
    </section>
  )
}

export default PageBanner
