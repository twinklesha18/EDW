const publicCacheValue = 'public, max-age=0, s-maxage=60, stale-while-revalidate=120'

export function cachePublicResponse(_request, response, next) {
  response.set('Cache-Control', publicCacheValue)
  next()
}
