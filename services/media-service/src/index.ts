import app from './app'
import { logger } from './utils/logger'

const PORT = Bun.env.PORT || 3004

async function startServer() {
  try {
    // TODO: Import and start your app here
    app.listen(PORT)
    logger.info(`media-service running on port ${PORT}`)
  } catch (error) {
    logger.error('Failed to start server:', error)
    process.exit(1)
  }
}

startServer()
