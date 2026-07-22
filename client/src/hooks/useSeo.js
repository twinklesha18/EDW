import { useEffect } from 'react'
import { applySeo } from '../utils/seo.js'

export function useSeo(configuration) {
  const { title, description, canonicalPath, image, imageAlt, type, robots } = configuration
  const structuredData = JSON.stringify(configuration.structuredData || null)

  useEffect(() => {
    applySeo({
      title,
      description,
      canonicalPath,
      image,
      imageAlt,
      type,
      robots,
      structuredData: structuredData === 'null' ? null : JSON.parse(structuredData),
    })
  }, [title, description, canonicalPath, image, imageAlt, type, robots, structuredData])
}
