import mongoose from 'mongoose'
import { env } from '../config/env.js'
import User from '../models/User.js'
const email = 'phase4-browser-admin@example.com'
try {
  await mongoose.connect(env.mongoUri)
  await User.deleteOne({ email })
  if (process.argv[2] !== 'remove') {
    await User.create({ firstName: 'Browser', lastName: 'Administrator', email, phone: '+94770000999', password: 'BrowserSecure1', role: 'admin', isActive: true })
    console.log(email)
  } else console.log('Browser fixture removed.')
} finally { await mongoose.disconnect() }
