function SectionTitle({ eyebrow, title, subtitle, align = 'center' }) {
  const alignment = align === 'left' ? 'items-start text-left' : 'items-center text-center'

  return (
    <div className={`flex max-w-2xl flex-col ${alignment}`}>
      {eyebrow && (
        <span className="mb-3 text-[0.68rem] font-semibold uppercase tracking-[0.3em] text-gold">
          {eyebrow}
        </span>
      )}
      <h2 className="break-words font-serif text-3xl font-semibold leading-tight text-ink sm:text-5xl">{title}</h2>
      {subtitle && <p className="mt-4 text-sm leading-7 text-muted sm:text-base">{subtitle}</p>}
    </div>
  )
}

export default SectionTitle
