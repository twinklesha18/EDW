function FeatureCard({ icon: Icon, title, description }) {
  return (
    <article className="rounded-[1.75rem] border border-gold/15 bg-white p-6 text-center shadow-[0_14px_40px_-32px_rgba(59,47,54,0.45)] sm:p-7">
      <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-gradient-to-br from-pink-light to-lavender/55 text-rosewood">
        <Icon size={20} aria-hidden="true" />
      </span>
      <h3 className="mt-5 font-serif text-xl font-semibold text-ink">{title}</h3>
      <p className="mt-3 text-sm leading-6 text-muted">{description}</p>
    </article>
  )
}

export default FeatureCard
