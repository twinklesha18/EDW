import mongoose from 'mongoose'
import { env } from './env.js'

let connectionPromise = null

export async function connectDatabase() {
  if (mongoose.connection.readyState === 1) return mongoose.connection

  if (!connectionPromise) {
    connectionPromise = mongoose.connect(env.mongoUri, {
      serverSelectionTimeoutMS: 10000,
    })
  }

  try {
    const connection = await connectionPromise

    console.log(env.isProduction ? 'MongoDB Atlas connected' : `Local MongoDB connected: ${connection.connection.name}`)

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
