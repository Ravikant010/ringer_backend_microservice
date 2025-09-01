import app from './app'
import { checkDatabaseConnection } from './database'
import { logger } from './utils/logger'

const PORT = process.env.PORT || 3003

async function startServer() {
  try {
    await checkDatabaseConnection()
   app.listen(PORT, ()=>console.log(`post-service running on port ${PORT}`))
  } catch (error) {
    logger.error('Failed to start server:', error)
    process.exit(1)
  }
}

startServer()
