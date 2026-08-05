import api from './api.js'

let bootstrapPromise
let cacheVersion = ''

export function getStorefrontBootstrap() {
  if (!bootstrapPromise) {
    bootstrapPromise = api.get('/storefront/bootstrap', {
      // A minute-based version prevents an old CDN response from replacing
      // newly uploaded catalog media while still allowing short-lived caching.
      params: { v: cacheVersion || Math.floor(Date.now() / 60000) },
    }).then((response) => response.data.data).catch((error) => {
      bootstrapPromise = undefined
      throw error
    })
  }
  return bootstrapPromise
}

export function invalidateStorefrontBootstrap() {
  cacheVersion = String(Date.now())
  bootstrapPromise = undefined
}
