import assert from 'node:assert/strict'
import mongoose from 'mongoose'
import app from '../app.js'
import { env } from '../config/env.js'
import Category from '../models/Category.js'
import Product from '../models/Product.js'

const port = 5114
let server

try {
  await mongoose.connect(env.mongoUri)
  const product = await Product.findOne({}).select('slug image.url').lean()
  const category = await Category.findOne({ isActive: true }).select('slug image.url').lean()
  server = app.listen(port)
  await new Promise((resolve) => server.once('listening', resolve))
  const response = await fetch(`http://127.0.0.1:${port}/sitemap.xml`)
  const sitemap = await response.text()
  const merchantResponse = await fetch(`http://127.0.0.1:${port}/merchant-feed.xml`)
  const merchantFeed = await merchantResponse.text()
  assert.equal(response.status, 200)
  assert.match(response.headers.get('content-type'), /application\/xml/)
  assert.match(sitemap, /<urlset[^>]+xmlns:image=/)
  assert.match(sitemap, /<loc>https:\/\/eshazdreamworld\.vercel\.app\/<\/loc>/)
  assert.match(sitemap, /<loc>https:\/\/eshazdreamworld\.vercel\.app\/shop<\/loc>/)
  if (category) {
    assert.ok(sitemap.includes(`<loc>https://eshazdreamworld.vercel.app/category/${category.slug}</loc>`))
  }
  if (product) {
    assert.ok(sitemap.includes(`<loc>https://eshazdreamworld.vercel.app/product/${product.slug}</loc>`))
    if (product.image?.url) assert.ok(sitemap.includes('<image:image>'))
  }
  assert.equal(merchantResponse.status, 200)
  assert.match(merchantResponse.headers.get('content-type'), /application\/xml/)
  assert.match(merchantFeed, /<rss xmlns:g="http:\/\/base\.google\.com\/ns\/1\.0" version="2\.0">/)
  assert.match(merchantFeed, /<g:availability>in_stock<\/g:availability>/)
  assert.match(merchantFeed, /<g:price>[\d.]+ LKR<\/g:price>/)
  assert.match(merchantFeed, /<g:brand>Eshaz Dream World<\/g:brand>/)
  console.log('SEO feed smoke test passed: sitemap categories, product images, variants, and the Google Merchant product feed are valid XML.')
} finally {
  if (server) await new Promise((resolve) => server.close(resolve))
  await mongoose.disconnect()
}
