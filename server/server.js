import app from './app.js'
import { connectDatabase, disconnectDatabase } from './config/db.js'
import { env } from './config/env.js'

let server

async function startServer() {
  await connectDatabase()

  server = app.listen(env.port, () => {
    console.log(`API server running on http://localhost:${env.port}`)
  })
}

async function shutdown(signal) {
  console.log(`${signal} received. Shutting down gracefully.`)

  if (server) {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()))
    })
  }

  await disconnectDatabase()
  process.exit(0)
}

startServer().catch((error) => {
  console.error(`Unable to start server: ${error.message}`)
  process.exit(1)
})

process.on('SIGINT', () => shutdown('SIGINT'))
process.on('SIGTERM', () => shutdown('SIGTERM'))

process.on('unhandledRejection', (error) => {
  console.error('Unhandled promise rejection:', error)
  shutdown('unhandledRejection')
})
