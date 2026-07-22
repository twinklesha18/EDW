import assert from 'node:assert/strict'
import mongoose from 'mongoose'
import app from '../app.js'
import { env } from '../config/env.js'
import Product from '../models/Product.js'

const port = 5114
let server

try {
  await mongoose.connect(env.mongoUri)
  const product = await Product.findOne({}).select('slug image.url').lean()
  server = app.listen(port)
  await new Promise((resolve) => server.once('listening', resolve))
  const response = await fetch(`http://127.0.0.1:${port}/sitemap.xml`)
  const sitemap = await response.text()
  assert.equal(response.status, 200)
  assert.match(response.headers.get('content-type'), /application\/xml/)
  assert.match(sitemap, /<urlset[^>]+xmlns:image=/)
  assert.match(sitemap, /<loc>https:\/\/edw-phi\.vercel\.app\/<\/loc>/)
  assert.match(sitemap, /<loc>https:\/\/edw-phi\.vercel\.app\/shop<\/loc>/)
  if (product) {
    assert.ok(sitemap.includes(`<loc>https://edw-phi.vercel.app/product/${product.slug}</loc>`))
    if (product.image?.url) assert.ok(sitemap.includes('<image:image>'))
  }
  console.log('SEO sitemap smoke test passed: public pages and live catalog products are exposed as valid XML.')
} finally {
  if (server) await new Promise((resolve) => server.close(resolve))
  await mongoose.disconnect()
}
