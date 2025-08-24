import { logger } from './utils/logger'
import dotenv from 'dotenv'
dotenv.config()

const PORT = process.env.PORT || 3003

async function startServer() {
  try {
    // TODO: Import and start your app here
    logger.info(`user-service running on port ${PORT}`)
  } catch (error) {
    logger.error('Failed to start server:', error)
    process.exit(1)
  }
}

startServer()
