import app from './app'
import { checkDatabaseConnection } from './database'
import { logger } from './utils/logger'

const PORT = Bun.env.PORT || 3006

async function startServer() {
  try {
await checkDatabaseConnection()
   app.listen(PORT, ()=>console.log(`comment-service running on port ${PORT}`))
  } catch (error) {
    logger.error('Failed to start server:', error)
    process.exit(1)
  }
}

startServer()
