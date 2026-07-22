import assert from 'node:assert/strict'
import mongoose from 'mongoose'

process.env.EDW_DISABLE_EMAIL = 'true'
import app from '../app.js'
import { env } from '../config/env.js'
import User from '../models/User.js'
import UserDeletionLog from '../models/UserDeletionLog.js'

const port = 5108
const base = `http://127.0.0.1:${port}/api`
const suffix = Date.now()
const adminEmail = `user-actions-admin-${suffix}@edw.test`
const customerEmail = `user-actions-customer-${suffix}@edw.test`
const createdEmail = `user-actions-created-${suffix}@edw.test`
const updatedEmail = `user-actions-updated-${suffix}@edw.test`
const password = 'UserActionsSecure1'
const changedPassword = 'ChangedSecure2'
let server

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

const login = (email, loginPassword = password) => request('/auth/login', {
  method: 'POST',
  body: { email, password: loginPassword, rememberMe: false },
})

try {
  await mongoose.connect(env.mongoUri)
  const admin = await User.create({ firstName: 'Actions', lastName: 'Admin', email: adminEmail, phone: '0751112233', password, role: 'admin' })
  const customer = await User.create({ firstName: 'Actions', lastName: 'Customer', email: customerEmail, phone: '0754445566', password, role: 'user' })
  server = app.listen(port)
  await new Promise((resolve) => server.once('listening', resolve))

  let result = await login(adminEmail)
  assert.equal(result.status, 200)
  const adminCookie = result.cookie
  result = await login(customerEmail)
  assert.equal(result.status, 200)
  const customerCookie = result.cookie

  const newUser = {
    firstName: 'Created', lastName: 'Administrator', email: createdEmail, phone: '0757778899',
    role: 'admin', isActive: true, password, confirmPassword: password,
  }

  result = await request('/admin/users', { method: 'POST', cookie: customerCookie, body: newUser })
  assert.equal(result.status, 403, 'Customers cannot create accounts through administrator routes')

  result = await request('/admin/users', {
    method: 'POST', cookie: adminCookie,
    body: { ...newUser, email: 'invalid', phone: '123', password: 'weak', confirmPassword: 'different' },
  })
  assert.equal(result.status, 422, 'Create validates email, phone, and password')
  assert.ok(result.body.errors.some((entry) => entry.field === 'email'))
  assert.ok(result.body.errors.some((entry) => entry.field === 'phone'))
  assert.ok(result.body.errors.some((entry) => entry.field === 'password'))

  result = await request('/admin/users', { method: 'POST', cookie: adminCookie, body: newUser })
  assert.equal(result.status, 201)
  assert.equal(result.body.data.user.role, 'admin')
  const createdId = result.body.data.user.id

  result = await request(`/admin/users/${createdId}`, { cookie: adminCookie })
  assert.equal(result.status, 200)
  assert.equal(result.body.data.user.email, createdEmail)
  result = await request(`/admin/users?search=${encodeURIComponent(createdEmail)}`, { cookie: adminCookie })
  assert.equal(result.status, 200)
  assert.equal(result.body.data.users.length, 1, 'Created accounts appear in the searchable user list')

  result = await login(createdEmail)
  assert.equal(result.status, 200)
  const createdCookieBeforeEdit = result.cookie
  result = await request(`/admin/users/${createdId}`, {
    method: 'PUT', cookie: adminCookie,
    body: { firstName: 'Updated', lastName: 'Customer', email: updatedEmail, phone: '0752223344', role: 'user', isActive: true },
  })
  assert.equal(result.status, 200)
  assert.equal(result.body.data.user.firstName, 'Updated')
  assert.equal(result.body.data.user.email, updatedEmail)
  assert.equal(result.body.data.user.phone, '0752223344')
  assert.equal(result.body.data.user.role, 'user')

  result = await request('/auth/me', { cookie: createdCookieBeforeEdit })
  assert.equal(result.status, 401, 'Changing account access revokes its existing sessions')
  result = await login(updatedEmail)
  assert.equal(result.status, 200)
  const createdCookieBeforePasswordChange = result.cookie

  result = await request(`/admin/users/${createdId}/password`, {
    method: 'PUT', cookie: adminCookie,
    body: { password: changedPassword, confirmPassword: changedPassword },
  })
  assert.equal(result.status, 200)
  result = await request('/auth/me', { cookie: createdCookieBeforePasswordChange })
  assert.equal(result.status, 401, 'Administrator password changes revoke the account\'s existing sessions')
  result = await login(updatedEmail)
  assert.equal(result.status, 401, 'The previous password no longer works')
  result = await login(updatedEmail, changedPassword)
  assert.equal(result.status, 200, 'The administrator-assigned password works')

  result = await request(`/admin/users/${createdId}/access`, { method: 'PUT', cookie: adminCookie, body: { isActive: false } })
  assert.equal(result.status, 200)
  result = await login(updatedEmail, changedPassword)
  assert.equal(result.status, 401, 'Deactivated users cannot sign in')
  result = await request(`/admin/users/${createdId}/access`, { method: 'PUT', cookie: adminCookie, body: { isActive: true } })
  assert.equal(result.status, 200)

  result = await request(`/admin/users/${admin._id}`, { method: 'DELETE', cookie: adminCookie })
  assert.equal(result.status, 409, 'An administrator cannot delete their own account')
  result = await request(`/admin/users/${createdId}`, { method: 'DELETE', cookie: adminCookie })
  assert.equal(result.status, 200)
  result = await request(`/admin/users/${createdId}`, { cookie: adminCookie })
  assert.equal(result.status, 404, 'Deleted users can no longer be read')

  result = await request(`/admin/users/${customer._id}/password-reset`, { method: 'POST', cookie: adminCookie })
  assert.equal(result.status, 200)
  assert.ok(result.body.data.resetUrl, 'Development exposes the secure reset URL when email is unavailable')
  const storedCustomer = await User.findById(customer._id).select('+resetPasswordToken +resetPasswordExpire')
  assert.ok(storedCustomer.resetPasswordToken)
  assert.ok(storedCustomer.resetPasswordExpire > new Date())

  console.log('User-management smoke test passed: authorization, validation, create, read, search, update, roles, activation, direct password change, session revocation, protected self-account, delete, and password reset.')
} finally {
  if (server) await new Promise((resolve) => server.close(resolve))
  await User.deleteMany({ email: { $in: [adminEmail, customerEmail, createdEmail, updatedEmail] } })
  await UserDeletionLog.deleteMany({ 'deletedUser.email': { $in: [createdEmail, updatedEmail] } })
  await mongoose.disconnect()
}
