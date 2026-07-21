import mongoose from 'mongoose'
import { env } from '../config/env.js'
import User from '../models/User.js'

const email = String(process.argv[2] || '').trim().toLowerCase()
if (!email) { console.error('Usage: npm run make-admin -- user@example.com'); process.exitCode = 1 } else {
  try {
    await mongoose.connect(env.mongoUri)
    const user = await User.findOne({ email })
    if (!user) throw new Error('No account exists with that email address')
    user.role = 'admin'; user.isActive = true; await user.save()
    console.log(`${email} now has administrator access.`)
  } catch (error) { console.error(`Unable to grant administrator access: ${error.message}`); process.exitCode = 1 } finally { await mongoose.disconnect() }
}
