import mongoose from 'mongoose'

const connectionStates = ['disconnected', 'connected', 'connecting', 'disconnecting']

export function getHealthStatus(_request, response) {
  response.status(200).json({
    success: true,
    message: 'Eshaz Dream World API is running',
    data: {
      environment: process.env.NODE_ENV || 'development',
      database: connectionStates[mongoose.connection.readyState] || 'unknown',
      timestamp: new Date().toISOString(),
    },
  })
}
