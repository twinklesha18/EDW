const publicCacheValue = 'public, max-age=60, s-maxage=300, stale-while-revalidate=86400'

export function cachePublicResponse(_request, response, next) {
  response.set('Cache-Control', publicCacheValue)
  next()
}
