import mongoose from 'mongoose'
import { env } from '../config/env.js'
import CustomOrder from '../models/CustomOrder.js'
import User from '../models/User.js'

const customOrderId = '64ed00000000000000000001'
const customOrderNumber = 'EDW-CUSTOM-2099-99999'

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
  await CustomOrder.deleteOne({ requestNumber: customOrderNumber })
  await User.deleteMany({ email: { $in: fixtures.map((fixture) => fixture.email) } })

  if (process.argv[2] !== 'remove') {
    const users = await User.create(fixtures)
    const customer = users.find((user) => user.role === 'user')
    await CustomOrder.create({
      _id: customOrderId,
      requestNumber: customOrderNumber,
      user: customer._id,
      occasion: 'Birthday',
      requiredDate: new Date(Date.now() + 7 * 86400000),
      budgetRange: 'LKR 5,000 - 10,000',
      preferredColors: 'Pastel pink and gold',
      giftType: 'Bouquet',
      bouquetType: 'Chocolate',
      description: 'Responsive browser fixture for custom-order tracking and payment layout.',
      status: 'Quoted',
      quotedPrice: 7500,
      statusHistory: [
        { status: 'Pending', note: 'Custom order submitted', updatedBy: customer._id },
        { status: 'Reviewing', note: 'Request reviewed' },
        { status: 'Quoted', note: 'Quote ready for customer' },
      ],
    })
    console.log('Responsive browser fixtures created.')
  } else {
    console.log('Responsive browser fixtures removed.')
  }
} finally {
  await mongoose.disconnect()
}
