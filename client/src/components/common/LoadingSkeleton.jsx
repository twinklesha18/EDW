function LoadingSkeleton() {
  return (
    <div className="section-shell animate-pulse py-16" role="status" aria-label="Loading page">
      <div className="mx-auto h-8 w-48 rounded-full bg-pink-light" />
      <div className="mx-auto mt-6 h-14 max-w-xl rounded-2xl bg-lavender/45" />
      <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} className="h-80 rounded-[2rem] bg-white shadow-sm" />
        ))}
      </div>
      <span className="sr-only">Loading…</span>
    </div>
  )
}

export default LoadingSkeleton
