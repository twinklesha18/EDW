import assert from 'node:assert/strict'
import mongoose from 'mongoose'
import app from '../app.js'
import { env } from '../config/env.js'
import { getDashboardAnalytics } from '../controllers/dashboardController.js'
import WebsiteVisit from '../models/WebsiteVisit.js'

const port = 5115
const marker = `analytics-test-${Date.now()}`
const visitorId = `${marker}-visitor`
const sessionId = `${marker}-session`
let server

try {
  await mongoose.connect(env.mongoUri)
  server = app.listen(port)
  await new Promise((resolve) => server.once('listening', resolve))

  const sendEvent = (eventType) => fetch(`http://127.0.0.1:${port}/api/analytics/visit`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'user-agent': 'EDW Analytics Smoke Browser' },
    body: JSON.stringify({ visitorId, sessionId, path: '/shop', eventType }),
  })
  const pageView = await sendEvent('pageview')
  const heartbeat = await sendEvent('heartbeat')
  assert.equal(pageView.status, 202)
  assert.equal(heartbeat.status, 202)

  const visit = await WebsiteVisit.findOne({ entryPath: '/shop' }).sort({ createdAt: -1 }).select('+visitorHash +sessionHash').lean()
  assert.ok(visit)
  assert.equal(visit.pageViews, 1, 'A heartbeat must not increase page views')
  assert.notEqual(visit.visitorHash, visitorId, 'The stored visitor identifier must be anonymous')
  assert.notEqual(visit.sessionHash, sessionId, 'The stored session identifier must be anonymous')

  let dashboardPayload
  await getDashboardAnalytics({}, {
    status(statusCode) {
      assert.equal(statusCode, 200)
      return this
    },
    json(payload) {
      dashboardPayload = payload
      return payload
    },
  })
  assert.equal(dashboardPayload.data.visitors.daily.length, 14)
  assert.ok(dashboardPayload.data.visitors.summary.activeVisitors >= 1)
  assert.ok(dashboardPayload.data.visitors.summary.pageViews >= 1)

  await WebsiteVisit.deleteOne({ _id: visit._id })
  console.log('Visitor analytics smoke test passed: anonymous page views and heartbeats are recorded correctly.')
} finally {
  if (server) await new Promise((resolve) => server.close(resolve))
  await mongoose.disconnect()
}
