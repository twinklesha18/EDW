import assert from 'node:assert/strict'
import jwt from 'jsonwebtoken'
import { env } from '../config/env.js'
import { checkoutValidator, trackingValidator } from '../middleware/checkoutValidateMiddleware.js'
import { registrationValidator } from '../middleware/validateMiddleware.js'
import { refreshAuthCookie, setAuthCookie } from '../utils/generateToken.js'

const validRegistration = {
  firstName: 'Session', lastName: 'Tester', email: ' Session.Tester@Example.com ', phone: '075 089 4221',
  password: 'SecurePassword1', confirmPassword: 'SecurePassword1',
}

let result = registrationValidator(validRegistration)
assert.equal(result.errors.length, 0)
assert.equal(result.values.email, 'session.tester@example.com')
assert.equal(result.values.phone, '0750894221')

for (const phone of ['750894221', '07508942211', '07508A4221']) {
  result = registrationValidator({ ...validRegistration, phone })
  assert.ok(result.errors.some((entry) => entry.field === 'phone'), `${phone} must be rejected`)
}

for (const email of ['missing-domain@', 'double..dot@example.com', 'name@example']) {
  result = registrationValidator({ ...validRegistration, email })
  assert.ok(result.errors.some((entry) => entry.field === 'email'), `${email} must be rejected`)
}

result = trackingValidator({ orderNumber: 'EDW-2026-000001', email: 'invalid@domain' })
assert.ok(result.errors.some((entry) => entry.field === 'email'))

const address = { fullName: 'Session Tester', phone: '0750894221', addressLine1: '1 Dream Lane', city: 'Colombo', district: 'Colombo', province: 'Western', country: 'Sri Lanka' }
result = checkoutValidator({ shippingAddress: { ...address, phone: '123' }, billingSameAsShipping: true, shippingMethod: 'standard' })
assert.ok(result.errors.some((entry) => entry.field === 'shippingAddress.phone'))

const response = {
  cookieValue: null,
  options: null,
  cookie(_name, value, options) { this.cookieValue = value; this.options = options },
  setHeader() {},
}
assert.equal(setAuthCookie(response, '507f1f77bcf86cd799439011'), true)
assert.ok(response.options.maxAge > 0 && response.options.maxAge <= env.session.idleMinutes * 60 * 1000)
const payload = jwt.verify(response.cookieValue, env.jwtSecret)
assert.equal(payload.sub, '507f1f77bcf86cd799439011')
assert.equal(payload.rem, false)

const expiredSessionPayload = { ...payload, sst: Math.floor((Date.now() - (env.session.absoluteHours * 60 * 60 * 1000) - 1000) / 1000) }
assert.equal(refreshAuthCookie(response, expiredSessionPayload), false)

console.log('Session and form validation smoke test passed: idle timeout, absolute timeout, 10-digit phones, normalized emails, checkout, and tracking validation.')
