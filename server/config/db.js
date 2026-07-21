import mongoose from 'mongoose'
import { env } from './env.js'

export async function connectDatabase() {
  const connection = await mongoose.connect(env.mongoUri, {
    serverSelectionTimeoutMS: 5000,
  })

  console.log(`MongoDB connected: ${connection.connection.host}`)
  return connection
}

export async function disconnectDatabase() {
  await mongoose.connection.close()
}
