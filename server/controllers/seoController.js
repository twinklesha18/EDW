import Category from '../models/Category.js'
import Product from '../models/Product.js'
import { getResolvedSiteSettings } from '../services/siteSettingsService.js'

const storefrontUrl = 'https://eshazdreamworld.vercel.app'
const staticPages = ['/', '/shop', '/categories', '/contact']

const escapeXml = (value) => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&apos;')

const urlEntry = ({ path, lastModified, image }) => [
  '  <url>',
  `    <loc>${escapeXml(`${storefrontUrl}${path}`)}</loc>`,
  ...(lastModified ? [`    <lastmod>${new Date(lastModified).toISOString()}</lastmod>`] : []),
  ...(image?.url ? [
    '    <image:image>',
    `      <image:loc>${escapeXml(image.url)}</image:loc>`,
    ...(image.title ? [`      <image:title>${escapeXml(image.title)}</image:title>`] : []),
    '    </image:image>',
  ] : []),
  '  </url>',
].join('\n')

export async function getSitemap(_request, response) {
  const [products, categories] = await Promise.all([
    Product.find({}).select('name slug image.url updatedAt').sort({ updatedAt: -1 }).lean(),
    Category.find({ isActive: true }).select('name slug image.url updatedAt').sort({ sortOrder: 1, name: 1 }).lean(),
  ])
  const entries = [
    ...staticPages.map((path) => urlEntry({ path })),
    ...categories.map((category) => urlEntry({
      path: `/category/${encodeURIComponent(category.slug)}`,
      lastModified: category.updatedAt,
      image: { url: category.image?.url, title: `${category.name} gifts` },
    })),
    ...products.map((product) => urlEntry({
      path: `/product/${encodeURIComponent(product.slug)}`,
      lastModified: product.updatedAt,
      image: { url: product.image?.url, title: product.name },
    })),
  ]
  const sitemap = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">',
    ...entries,
    '</urlset>',
  ].join('\n')

  response
    .set('Content-Type', 'application/xml; charset=utf-8')
    .set('Cache-Control', 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400')
    .status(200)
    .send(sitemap)
}

export async function getMerchantFeed(_request, response) {
  const [products, settings] = await Promise.all([
    Product.find({}).populate('category', 'name slug').sort({ updatedAt: -1 }).lean(),
    getResolvedSiteSettings(),
  ])
  const shippingFee = Number(settings.shipping?.standardFee || 0).toFixed(2)
  const items = products.flatMap((product) => Object.entries(product.prices || {}).map(([size, price]) => [
    '    <item>',
    `      <g:id>${escapeXml(`${product._id}-${size}`)}</g:id>`,
    `      <g:item_group_id>${escapeXml(product._id)}</g:item_group_id>`,
    `      <title>${escapeXml(`${product.name} - Size ${size}`)}</title>`,
    `      <description>${escapeXml(product.description)}</description>`,
    `      <link>${escapeXml(`${storefrontUrl}/product/${encodeURIComponent(product.slug)}?size=${encodeURIComponent(size)}`)}</link>`,
    `      <g:image_link>${escapeXml(product.image?.url || '')}</g:image_link>`,
    '      <g:availability>in_stock</g:availability>',
    '      <g:condition>new</g:condition>',
    `      <g:price>${escapeXml(`${Number(price).toFixed(2)} LKR`)}</g:price>`,
    '      <g:brand>Eshaz Dream World</g:brand>',
    `      <g:size>${escapeXml(size)}</g:size>`,
    ...(product.category?.name ? [`      <g:product_type>${escapeXml(product.category.name)}</g:product_type>`] : []),
    '      <g:identifier_exists>no</g:identifier_exists>',
    '      <g:shipping>',
    '        <g:country>LK</g:country>',
    '        <g:service>Standard Delivery</g:service>',
    `        <g:price>${escapeXml(`${shippingFee} LKR`)}</g:price>`,
    '      </g:shipping>',
    '    </item>',
  ].join('\n')))
  const feed = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss xmlns:g="http://base.google.com/ns/1.0" version="2.0">',
    '  <channel>',
    '    <title>Eshaz Dream World Products</title>',
    `    <link>${storefrontUrl}</link>`,
    '    <description>Custom bouquets and personalized gifts in Sri Lanka.</description>',
    ...items,
    '  </channel>',
    '</rss>',
  ].join('\n')

  response
    .set('Content-Type', 'application/xml; charset=utf-8')
    .set('Cache-Control', 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400')
    .status(200)
    .send(feed)
}
