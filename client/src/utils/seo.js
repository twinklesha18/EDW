export const SITE_URL = String(import.meta.env.VITE_SITE_URL || 'https://eshazdreamworld.vercel.app').replace(/\/$/, '')
export const INDEX_ROBOTS = 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1'
export const NO_INDEX_ROBOTS = 'noindex, nofollow'

export const absoluteUrl = (value = '/') => {
  try { return new URL(value, `${SITE_URL}/`).href }
  catch { return `${SITE_URL}/` }
}

const upsertMeta = (attribute, key, content) => {
  let element = document.head.querySelector(`meta[${attribute}="${key}"]`)
  if (!element) {
    element = document.createElement('meta')
    element.setAttribute(attribute, key)
    document.head.appendChild(element)
  }
  element.setAttribute('content', content)
}

const setCanonical = (path) => {
  let canonical = document.head.querySelector('link[rel="canonical"]')
  if (!path) {
    canonical?.remove()
    return
  }
  if (!canonical) {
    canonical = document.createElement('link')
    canonical.setAttribute('rel', 'canonical')
    document.head.appendChild(canonical)
  }
  canonical.setAttribute('href', absoluteUrl(path))
}

const setStructuredData = (structuredData) => {
  let script = document.getElementById('edw-structured-data')
  if (!structuredData) {
    script?.remove()
    return
  }
  if (!script) {
    script = document.createElement('script')
    script.id = 'edw-structured-data'
    script.type = 'application/ld+json'
    document.head.appendChild(script)
  }
  script.textContent = JSON.stringify(structuredData).replaceAll('<', '\\u003c')
}

export function applySeo({ title, description, canonicalPath, image, imageAlt = '', type = 'website', robots = INDEX_ROBOTS, structuredData }) {
  const canonicalUrl = canonicalPath ? absoluteUrl(canonicalPath) : ''
  const imageUrl = absoluteUrl(image)

  document.documentElement.lang = 'en-LK'
  document.title = title
  upsertMeta('name', 'description', description)
  upsertMeta('name', 'robots', robots)
  upsertMeta('name', 'googlebot', robots)
  upsertMeta('property', 'og:type', type)
  upsertMeta('property', 'og:locale', 'en_LK')
  upsertMeta('property', 'og:site_name', 'Eshaz Dream World')
  upsertMeta('property', 'og:title', title)
  upsertMeta('property', 'og:description', description)
  upsertMeta('property', 'og:url', canonicalUrl || SITE_URL)
  upsertMeta('property', 'og:image', imageUrl)
  upsertMeta('property', 'og:image:alt', imageAlt || title)
  upsertMeta('name', 'twitter:card', 'summary_large_image')
  upsertMeta('name', 'twitter:title', title)
  upsertMeta('name', 'twitter:description', description)
  upsertMeta('name', 'twitter:image', imageUrl)
  setCanonical(canonicalPath)
  setStructuredData(structuredData)
}
