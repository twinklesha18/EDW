import mongoose from 'mongoose'
import { env } from './env.js'

let connectionPromise = null

export async function connectDatabase() {
  // Already connected
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection
  }

  // Avoid creating many connections in Vercel
  if (!connectionPromise) {
    connectionPromise = mongoose.connect(env.mongoUri, {
      serverSelectionTimeoutMS: 10000
    })
  }

  try {
    const connection = await connectionPromise

    console.log(`MongoDB connected: ${connection.connection.host}`)

    return connection.connection
  } catch (error) {
    connectionPromise = null
    console.error(`MongoDB connection failed: ${error.message}`)
    throw error
  }
}

export async function disconnectDatabase() {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close()
  }

  connectionPromise = null
}