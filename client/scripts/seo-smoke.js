import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const html = readFileSync(path.join(root, 'dist', 'index.html'), 'utf8')
const robots = readFileSync(path.join(root, 'dist', 'robots.txt'), 'utf8')
const vercel = JSON.parse(readFileSync(path.join(root, 'vercel.json'), 'utf8'))
const seoManager = readFileSync(path.join(root, 'src', 'components', 'common', 'SeoManager.jsx'), 'utf8')
const productPage = readFileSync(path.join(root, 'src', 'pages', 'ProductDetailsPage.jsx'), 'utf8')

assert.match(html, /<html lang="en-LK">/)
assert.ok(html.includes('<title>Custom Gifts &amp; Bouquets in Sri Lanka | Eshaz Dream World</title>'))
assert.match(html, /name="description"/)
assert.match(html, /name="robots" content="index, follow/)
assert.match(html, /property="og:title"/)
assert.match(html, /name="twitter:card"/)
const socialImage = html.match(/property="og:image" content="https:\/\/eshazdreamworld\.vercel\.app(\/assets\/[^"?]+)"/)?.[1]
assert.ok(socialImage, 'The Open Graph image must use an absolute production URL')
assert.ok(existsSync(path.join(root, 'dist', socialImage)), 'The Open Graph image must exist in the production build')
assert.match(html, /<link rel="canonical" href="https:\/\/eshazdreamworld\.vercel\.app\/"/)
assert.match(robots, /Sitemap: https:\/\/eshazdreamworld\.vercel\.app\/sitemap\.xml/)
assert.doesNotMatch(robots, /Disallow: \/admin/)
assert.ok(vercel.rewrites.some((rewrite) => rewrite.source === '/sitemap.xml' && rewrite.destination.endsWith('/sitemap.xml')))
assert.ok(vercel.headers.some((rule) => rule.headers?.some((header) => header.key === 'X-Robots-Tag' && header.value === 'noindex, nofollow')))
assert.match(seoManager, /'@type': 'OnlineStore'/)
assert.match(seoManager, /'@type': 'WebSite'/)
assert.match(productPage, /'@type': 'Product'/)
assert.match(productPage, /'@type': 'BreadcrumbList'/)
assert.match(productPage, /'@type': 'AggregateRating'/)

console.log('SEO smoke test passed: metadata, social image, robots, sitemap rewrite, no-index headers, and structured data are configured.')
