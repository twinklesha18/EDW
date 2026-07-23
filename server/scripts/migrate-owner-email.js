import dns from 'node:dns'
import mongoose from 'mongoose'
import { env } from '../config/env.js'
import SiteSetting from '../models/SiteSetting.js'
import User from '../models/User.js'
import { isValidEmail, normalizeEmail } from '../utils/inputValidation.js'

const previousEmail = normalizeEmail(process.argv[2])
const replacementEmail = normalizeEmail(process.argv[3])
const dnsServers = String(process.env.MONGODB_DNS_SERVERS || '').split(',').map((value) => value.trim()).filter(Boolean)

if (dnsServers.length) dns.setServers(dnsServers)

if (!isValidEmail(previousEmail) || !isValidEmail(replacementEmail) || previousEmail === replacementEmail) {
  console.error('Usage: npm run migrate:owner-email -- old@example.com new@example.com')
  process.exitCode = 1
} else {
  try {
    await mongoose.connect(env.mongoUri)

    const [previousUser, replacementUser] = await Promise.all([
      User.findOne({ email: previousEmail }).select('+sessionVersion'),
      User.findOne({ email: replacementEmail }).select('_id email'),
    ])

    if (previousUser && replacementUser && !previousUser._id.equals(replacementUser._id)) {
      throw new Error('The replacement email already belongs to another account; accounts were not merged')
    }

    const settingsResult = await SiteSetting.updateMany(
      { 'contact.email': previousEmail },
      { $set: { 'contact.email': replacementEmail } },
      { runValidators: true },
    )

    let adminAccountUpdated = false
    if (previousUser) {
      previousUser.email = replacementEmail
      previousUser.sessionVersion = Number(previousUser.sessionVersion || 0) + 1
      await previousUser.save()
      adminAccountUpdated = true
    }

    console.log(JSON.stringify({
      database: env.isProduction ? 'production' : 'local',
      siteSettingsUpdated: settingsResult.modifiedCount,
      adminAccountUpdated,
      replacementAccountAlreadyExisted: Boolean(!previousUser && replacementUser),
    }))
  } catch (error) {
    console.error(`Owner email migration failed: ${error.message}`)
    process.exitCode = 1
  } finally {
    await mongoose.disconnect()
  }
}
