import { useMemo } from 'react'
import { useLocation } from 'react-router-dom'
import { brandLogo } from '../../assets/images/index.js'
import { useBrand } from '../../hooks/useBrand.js'
import { useSeo } from '../../hooks/useSeo.js'
import { INDEX_ROBOTS, NO_INDEX_ROBOTS, SITE_URL, absoluteUrl } from '../../utils/seo.js'

const publicPages = {
  '/': {
    title: 'Custom Gifts & Bouquets in Sri Lanka | Eshaz Dream World',
    description: 'Shop elegant custom bouquets and personalized gifts from Eshaz Dream World in Sri Lanka. Thoughtful creations for birthdays and special occasions.',
  },
  '/shop': {
    title: 'Shop Custom Gifts & Bouquets | Eshaz Dream World',
    description: 'Browse custom bouquets, chocolate gifts and personalized creations for birthdays and special occasions in Sri Lanka.',
  },
  '/categories': {
    title: 'Gift & Bouquet Categories | Eshaz Dream World',
    description: 'Explore bouquet and personalized gift categories designed for birthdays, celebrations and meaningful moments.',
  },
  '/contact': {
    title: 'Contact Eshaz Dream World | Custom Gift Enquiries',
    description: 'Contact Eshaz Dream World by phone, email or WhatsApp for custom bouquets, personalized gifts and order enquiries.',
  },
}

const draftPages = {
  '/faq': 'Frequently Asked Questions',
  '/shipping': 'Shipping Information',
  '/returns': 'Return Policy',
  '/privacy': 'Privacy Policy',
  '/terms': 'Terms and Conditions',
}

const privatePath = /^\/(?:admin|profile|checkout|cart|wishlist|orders?|order-success|order-failed|custom-orders|track-order|login|register|forgot-password|reset-password)(?:\/|$)/

function SeoManager() {
  const { pathname } = useLocation()
  const { name, tagline, logo, contact } = useBrand()
  const fallbackImage = logo?.url || brandLogo

  const organizationData = useMemo(() => ({
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'OnlineStore',
        '@id': `${SITE_URL}/#store`,
        name,
        url: `${SITE_URL}/`,
        description: 'Custom bouquets and personalized gifts for birthdays and special occasions in Sri Lanka.',
        logo: absoluteUrl(fallbackImage),
        image: absoluteUrl(fallbackImage),
        email: contact.email,
        telephone: contact.phoneHref?.replace('tel:', '') || contact.phone,
        currenciesAccepted: 'LKR',
        paymentAccepted: ['Cash on Delivery', 'Bank Transfer'],
        areaServed: { '@type': 'Country', name: 'Sri Lanka' },
        sameAs: [contact.instagram, contact.facebook, contact.tiktok].filter(Boolean),
        contactPoint: {
          '@type': 'ContactPoint',
          telephone: contact.phoneHref?.replace('tel:', '') || contact.phone,
          email: contact.email,
          contactType: 'customer service',
          areaServed: 'LK',
        },
      },
      {
        '@type': 'WebSite',
        '@id': `${SITE_URL}/#website`,
        url: `${SITE_URL}/`,
        name,
        alternateName: 'EDW',
        description: tagline,
        publisher: { '@id': `${SITE_URL}/#store` },
        inLanguage: 'en-LK',
      },
    ],
  }), [contact, fallbackImage, name, tagline])

  let seo
  if (publicPages[pathname]) {
    seo = { ...publicPages[pathname], canonicalPath: pathname, robots: INDEX_ROBOTS, structuredData: pathname === '/' ? organizationData : null }
  } else if (/^\/product\/[^/]+$/.test(pathname)) {
    seo = {
      title: 'Custom Gift Creation | Eshaz Dream World',
      description: 'View this custom gift creation from Eshaz Dream World and choose the size that suits your special occasion.',
      canonicalPath: pathname,
      robots: INDEX_ROBOTS,
    }
  } else if (draftPages[pathname]) {
    seo = {
      title: `${draftPages[pathname]} | Eshaz Dream World`,
      description: `Read ${draftPages[pathname].toLowerCase()} for Eshaz Dream World.`,
      robots: NO_INDEX_ROBOTS,
    }
  } else {
    seo = {
      title: privatePath.test(pathname) ? 'Secure Account | Eshaz Dream World' : 'Page Not Found | Eshaz Dream World',
      description: privatePath.test(pathname) ? 'Secure Eshaz Dream World customer or administration page.' : 'The requested Eshaz Dream World page could not be found.',
      robots: NO_INDEX_ROBOTS,
    }
  }

  useSeo({ ...seo, image: fallbackImage, imageAlt: `${name} logo` })
  return null
}

export default SeoManager
