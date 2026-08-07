const cloudinaryMarkers = ['/image/upload/', '/image/fetch/']

export function optimizedImageUrl(url, width, { crop = 'limit', quality = '90' } = {}) {
  const marker = cloudinaryMarkers.find((candidate) => String(url || '').includes(candidate))
  if (!url || !Number.isFinite(width) || !String(url).includes('res.cloudinary.com') || !marker) return url
  const transformation = `c_${crop},w_${Math.round(width)},a_auto,f_auto,q_${quality}`
  return String(url).replace(marker, `${marker}${transformation}/`)
}

export function responsiveImageProps(url, widths = [360, 540, 720, 1080, 1440], options) {
  if (!url || !String(url).includes('res.cloudinary.com')) return { src: url }
  const largest = widths.at(-1)
  return {
    src: optimizedImageUrl(url, largest, options),
    srcSet: widths.map((width) => `${optimizedImageUrl(url, width, options)} ${width}w`).join(', '),
  }
}

export function applyImageFallback(event, fallbackUrl) {
  const image = event.currentTarget
  if (!fallbackUrl || image.dataset.fallbackApplied === 'true') return
  image.dataset.fallbackApplied = 'true'
  image.removeAttribute('srcset')
  image.removeAttribute('sizes')
  image.src = fallbackUrl
}
