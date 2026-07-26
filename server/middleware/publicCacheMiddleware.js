const publicCacheValue = 'public, max-age=30, s-maxage=120, stale-while-revalidate=600'

export function cachePublicResponse(_request, response, next) {
  response.set('Cache-Control', publicCacheValue)
  next()
}

