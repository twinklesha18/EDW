import mongoose from 'mongoose'
import { env } from '../config/env.js'
import User from '../models/User.js'

const fixtures = [
  {
    firstName: 'Responsive',
    lastName: 'Customer',
    email: 'responsive-customer@edw.test',
    phone: '+94770000881',
    password: 'ResponsiveSecure1',
    role: 'user',
    isActive: true,
  },
  {
    firstName: 'Responsive',
    lastName: 'Administrator',
    email: 'responsive-admin@edw.test',
    phone: '+94770000882',
    password: 'ResponsiveSecure1',
    role: 'admin',
    isActive: true,
  },
]

try {
  await mongoose.connect(env.mongoUri)
  await User.deleteMany({ email: { $in: fixtures.map((fixture) => fixture.email) } })

  if (process.argv[2] !== 'remove') {
    await User.create(fixtures)
    console.log('Responsive browser fixtures created.')
  } else {
    console.log('Responsive browser fixtures removed.')
  }
} finally {
  await mongoose.disconnect()
}
