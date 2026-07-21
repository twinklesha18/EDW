function AdminPageHeader({ eyebrow = 'Administration', title, description, action }) {
  return (
    <header className="flex min-w-0 flex-col items-start justify-between gap-4 sm:flex-row sm:flex-wrap sm:items-end">
      <div className="min-w-0">
        <p className="text-[.65rem] font-bold uppercase tracking-[.18em] text-gold sm:text-[.68rem] sm:tracking-[.2em]">
          {eyebrow}
        </p>
        <h1 className="mt-1 break-words font-serif text-3xl font-semibold leading-tight text-ink sm:text-4xl">{title}</h1>
        {description && <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">{description}</p>}
      </div>
      {action && <div className="w-full sm:w-auto [&>*]:w-full sm:[&>*]:w-auto">{action}</div>}
    </header>
  )
}

export default AdminPageHeader
