import assert from 'node:assert/strict'
import mongoose from 'mongoose'

process.env.EDW_DISABLE_EMAIL = 'true'
import app from '../app.js'
import { env } from '../config/env.js'
import User from '../models/User.js'
import UserDeletionLog from '../models/UserDeletionLog.js'

const port = 5120
const base = `http://127.0.0.1:${port}/api`
const suffix = Date.now()
const email = `customer-actions-${suffix}@edw.test`
const password = 'CustomerSecure1'
let server
let user

async function request(route, { method = 'GET', cookie, body } = {}) {
  const response = await fetch(`${base}${route}`, {
    method,
    headers: { ...(cookie && { Cookie: cookie }), ...(body && { 'Content-Type': 'application/json' }) },
    body: body ? JSON.stringify(body) : undefined,
  })
  return {
    status: response.status,
    body: await response.json(),
    cookie: response.headers.get('set-cookie')?.split(';')[0],
  }
}

const login = () => request('/auth/login', { method: 'POST', body: { email, password, rememberMe: false } })

try {
  await mongoose.connect(env.mongoUri)
  user = await User.create({ firstName: 'Customer', lastName: 'Actions', email, phone: '0756677889', password, role: 'user' })
  server = app.listen(port)
  await new Promise((resolve) => server.once('listening', resolve))

  const firstLogin = await login()
  const secondLogin = await login()
  assert.equal(firstLogin.status, 200)
  assert.equal(secondLogin.status, 200)

  let result = await request('/users/sessions/revoke-all', { method: 'POST', cookie: firstLogin.cookie, body: { currentPassword: 'WrongPassword1' } })
  assert.equal(result.status, 400, 'A wrong password cannot revoke sessions')
  result = await request('/auth/me', { cookie: secondLogin.cookie })
  assert.equal(result.status, 200, 'Other sessions remain valid after a rejected request')

  result = await request('/users/sessions/revoke-all', { method: 'POST', cookie: firstLogin.cookie, body: { currentPassword: password } })
  assert.equal(result.status, 200)
  assert.match(result.body.message, /all devices/i)
  result = await request('/auth/me', { cookie: firstLogin.cookie })
  assert.equal(result.status, 401, 'The initiating session is revoked')
  result = await request('/auth/me', { cookie: secondLogin.cookie })
  assert.equal(result.status, 401, 'Every other session is revoked')

  const thirdLogin = await login()
  assert.equal(thirdLogin.status, 200)
  result = await request('/users/account', { method: 'DELETE', cookie: thirdLogin.cookie, body: { currentPassword: password, confirmation: 'delete' } })
  assert.equal(result.status, 422, 'Deletion requires the exact confirmation phrase')
  result = await request('/users/account', { method: 'DELETE', cookie: thirdLogin.cookie, body: { currentPassword: 'WrongPassword1', confirmation: 'DELETE' } })
  assert.equal(result.status, 400, 'A wrong password cannot delete an account')
  assert.equal(await User.countDocuments({ _id: user._id }), 1)

  result = await request('/users/account', { method: 'DELETE', cookie: thirdLogin.cookie, body: { currentPassword: password, confirmation: 'DELETE' } })
  assert.equal(result.status, 200, JSON.stringify(result.body))
  assert.equal(await User.countDocuments({ _id: user._id }), 0, 'The customer account is deleted')
  assert.equal((await login()).status, 401, 'A deleted customer can no longer sign in')
  const log = await UserDeletionLog.findOne({ 'deletedUser.originalId': String(user._id) })
  assert.ok(log, 'The administrator-facing deletion audit record remains')
  assert.equal(log.status, 'Completed')
  assert.equal(log.deletedUser.email, email)

  console.log('Customer account-actions smoke test passed: password confirmation, all-device session revocation, permanent deletion, login denial, and audit logging.')
} finally {
  if (server) await new Promise((resolve) => server.close(resolve))
  if (user?._id) await UserDeletionLog.deleteMany({ 'deletedUser.originalId': String(user._id) })
  await User.deleteMany({ email })
  await mongoose.disconnect()
}
