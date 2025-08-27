import app from './app'
import { checkDatabaseConnection } from './database'
import { logger } from './utils/logger'

const PORT = process.env.PORT || 3003

async function startServer() {
  try {
    // TODO: Import and start your app here
   await checkDatabaseConnection()
   app.listen(PORT, ()=>console.log(`User service running on port ${PORT}`))
    // logger.info(`user-service running on port ${PORT}`)
  } catch (error) {
    logger.error('Failed to start server:', error)
    process.exit(1)
  }
}

startServer()
