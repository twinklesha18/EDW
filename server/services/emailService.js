import nodemailer from 'nodemailer'
import { env } from '../config/env.js'

export const isEmailConfigured = Boolean(env.email.host && env.email.user && env.email.pass)
const transporter = isEmailConfigured ? nodemailer.createTransport({
  host: env.email.host,
  port: env.email.port,
  secure: env.email.port === 465,
  auth: { user: env.email.user, pass: env.email.pass },
  pool: true,
}) : null

export async function sendEmail({ to, subject, html }) {
  if (!isEmailConfigured) return { skipped: true }
  return transporter.sendMail({ from: env.email.from, to, subject, html })
}

export function sendEmailSafely(message) {
  return sendEmail(message).catch((error) => {
    console.error(`Email delivery failed: ${error.message}`)
    return { failed: true }
  })
}
