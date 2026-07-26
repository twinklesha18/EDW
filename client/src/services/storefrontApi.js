import api from './api.js'

let bootstrapPromise
let cacheVersion = ''

export function getStorefrontBootstrap() {
  if (!bootstrapPromise) {
    bootstrapPromise = api.get('/storefront/bootstrap', {
      params: cacheVersion ? { v: cacheVersion } : undefined,
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

