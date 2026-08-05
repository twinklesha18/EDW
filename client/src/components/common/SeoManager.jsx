import { useMemo } from 'react'
import { useLocation } from 'react-router-dom'
import { brandLogo } from '../../assets/images/index.js'
import { useBrand } from '../../hooks/useBrand.js'
import { useSeo } from '../../hooks/useSeo.js'
import { INDEX_ROBOTS, NO_INDEX_ROBOTS, SITE_URL, absoluteUrl } from '../../utils/seo.js'
import { SEO_KEYWORDS } from '../../utils/seoKeywords.js'

const publicPages = {
  '/': {
    title: 'Custom Gifts Batticaloa & Sri Lanka | Eshaz Dream World',
    description: 'Shop custom gifts, personalized bouquets and handmade surprises from Eshaz Dream World in Batticaloa, with gift delivery across Sri Lanka.',
    keywords: SEO_KEYWORDS.home,
  },
  '/shop': {
    title: 'Online Gift Shop Batticaloa | Eshaz Dream World',
    description: 'Order custom gifts, personalized bouquets and gift hampers online in Batticaloa for birthdays, anniversaries and delivery across Sri Lanka.',
    keywords: SEO_KEYWORDS.shop,
  },
  '/categories': {
    title: 'Custom Gift Categories Batticaloa | Eshaz Dream World',
    description: 'Explore custom bouquets, personalized gifts, photo gifts and gift boxes in Batticaloa for birthdays, anniversaries and special occasions.',
    keywords: SEO_KEYWORDS.categories,
  },
  '/contact': {
    title: 'Gift Delivery Batticaloa | Contact Eshaz Dream World',
    description: 'Contact Eshaz Dream World in Batticaloa by phone, email or WhatsApp for custom gifts, personalized bouquets, delivery and order enquiries.',
    keywords: SEO_KEYWORDS.contact,
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
  const managedLogo = logo?.url || brandLogo
  const searchImage = '/eshaz-dream-world-social-2026-07.jpg'

  const organizationData = useMemo(() => ({
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': ['OnlineStore', 'Store'],
        '@id': `${SITE_URL}/#store`,
        name,
        url: `${SITE_URL}/`,
        description: 'Custom gifts, personalized bouquets and handmade surprises from Batticaloa, with gift delivery across Sri Lanka.',
        logo: absoluteUrl(managedLogo),
        image: absoluteUrl(searchImage),
        email: contact.email,
        telephone: contact.phoneHref?.replace('tel:', '') || contact.phone,
        currenciesAccepted: 'LKR',
        paymentAccepted: ['Cash on Delivery', 'Bank Transfer'],
        priceRange: 'LKR',
        address: {
          '@type': 'PostalAddress',
          addressLocality: 'Batticaloa',
          addressRegion: 'Eastern Province',
          addressCountry: 'LK',
        },
        geo: {
          '@type': 'GeoCoordinates',
          latitude: 7.7289775,
          longitude: 81.6929807,
        },
        areaServed: [
          { '@type': 'City', name: 'Batticaloa' },
          { '@type': 'Country', name: 'Sri Lanka' },
        ],
        hasMap: contact.mapsHref,
        knowsAbout: ['Custom gifts', 'Personalized gifts', 'Handmade gifts', 'Custom bouquets', 'Gift hampers', 'Birthday gifts', 'Anniversary gifts', 'Photo gifts'],
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
        alternateName: ['Eshaz Dream World Sri Lanka', 'EDW'],
        description: tagline,
        publisher: { '@id': `${SITE_URL}/#store` },
        inLanguage: 'en-LK',
        potentialAction: {
          '@type': 'SearchAction',
          target: `${SITE_URL}/shop?search={search_term_string}`,
          'query-input': 'required name=search_term_string',
        },
      },
    ],
  }), [contact, managedLogo, name, tagline])

  let seo
  if (publicPages[pathname]) {
    seo = { ...publicPages[pathname], canonicalPath: pathname, robots: INDEX_ROBOTS, structuredData: pathname === '/' ? organizationData : null }
  } else if (/^\/product\/[^/]+$/.test(pathname)) {
    seo = {
      title: 'Custom Gift Creation | Eshaz Dream World',
      description: 'View this custom gift from Eshaz Dream World in Batticaloa and choose a size for delivery across Sri Lanka.',
      keywords: SEO_KEYWORDS.shop,
      canonicalPath: pathname,
      robots: INDEX_ROBOTS,
    }
  } else if (/^\/category\/[^/]+$/.test(pathname)) {
    seo = {
      title: 'Gift Collection | Eshaz Dream World',
      description: 'Explore custom and personalized gift collections from Eshaz Dream World in Batticaloa, with delivery across Sri Lanka.',
      keywords: SEO_KEYWORDS.categories,
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

  useSeo({ ...seo, image: searchImage, imageAlt: `${name} logo` })
  return null
}

export default SeoManager
