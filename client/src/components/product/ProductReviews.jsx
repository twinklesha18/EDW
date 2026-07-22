function ProductReviews({ reviews }) {
  return <section className="section-shell py-16">
    <div><p className="text-xs font-bold uppercase tracking-[.2em] text-gold">Customer stories</p><h2 className="mt-2 font-serif text-4xl font-semibold">Reviews</h2><p className="mt-2 text-sm text-muted">Customers can submit a review from their dashboard after a delivered order.</p></div>
    <div className="mt-8 grid gap-4 lg:grid-cols-2">
      {reviews.map((review) => <article key={review.id || review._id} className="rounded-[1.5rem] border border-gold/15 bg-white p-6"><div className="flex items-start justify-between gap-3"><div><p className="font-semibold">{review.user?.firstName} {review.user?.lastName}</p><p className="mt-1 text-xs text-muted">{new Date(review.createdAt).toLocaleDateString()}</p></div><span className="text-gold">{'★'.repeat(review.rating)}</span></div>{review.title && <h3 className="mt-4 font-serif text-xl font-semibold">{review.title}</h3>}<p className="mt-2 text-sm leading-7 text-muted">{review.comment}</p></article>)}
      {!reviews.length && <p className="rounded-2xl bg-pink-light/35 p-8 text-center text-sm text-muted lg:col-span-2">No approved reviews yet.</p>}
    </div>
  </section>
}

export default ProductReviews
