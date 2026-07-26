function RouteLoading() {
  return (
    <div className="grid min-h-[50svh] place-items-center bg-cream" role="status" aria-live="polite">
      <div className="text-center">
        <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-pink-primary border-t-rosewood" />
        <p className="mt-3 text-sm text-muted">Checking your session…</p>
      </div>
    </div>
  )
}

export default RouteLoading

