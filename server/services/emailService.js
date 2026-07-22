import nodemailer from 'nodemailer'
import { env } from '../config/env.js'

export const isEmailConfigured = Boolean(env.email.host && env.email.user && env.email.pass)
const transporter = isEmailConfigured ? nodemailer.createTransport({
  host: env.email.host,
  port: env.email.port,
  secure: env.email.port === 465,
  auth: { user: env.email.user, pass: env.email.pass },
  pool: true,
  connectionTimeout: 10000,
  greetingTimeout: 10000,
  socketTimeout: 20000,
}) : null

export async function sendEmail({ to, subject, html }) {
  if (process.env.EDW_DISABLE_EMAIL === 'true') return { skipped: true, reason: 'disabled' }
  if (String(to || '').trim().toLowerCase().endsWith('@edw.test')) return { skipped: true, reason: 'test-recipient' }
  if (!isEmailConfigured) return { skipped: true }
  return transporter.sendMail({ from: env.email.from, to, subject, html })
}

export function sendEmailSafely(message) {
  return sendEmail(message).catch((error) => {
    console.error(`Email delivery failed: ${error.message}`)
    return { failed: true }
  })
}

export async function verifyEmailConnection() {
  if (!isEmailConfigured) return { configured: false, verified: false }
  await transporter.verify()
  return { configured: true, verified: true }
}
