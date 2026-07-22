import Product from '../models/Product.js'

const storefrontUrl = 'https://edw-phi.vercel.app'
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
  const products = await Product.find({}).select('name slug image.url updatedAt').sort({ updatedAt: -1 }).lean()
  const entries = [
    ...staticPages.map((path) => urlEntry({ path })),
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
