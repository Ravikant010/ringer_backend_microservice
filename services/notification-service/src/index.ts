import app from './app'
import { logger } from './utils/logger'
import { notificationConsumer } from './events/kafka.consumer'  // Add this

const PORT = Bun.env.PORT || 3007

async function startServer() {
  try {
    app.listen(PORT)
    logger.info(`notification-service running on port ${PORT}`)

    // Start Kafka consumer
    await notificationConsumer.connect()
    logger.info('Kafka consumer started')
  } catch (error) {
    logger.error('Failed to start server:', error)
    process.exit(1)
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully')
  await notificationConsumer.disconnect()
  process.exit(0)
})

startServer()
