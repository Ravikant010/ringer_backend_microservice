import app from './app';
import { kafkaService } from './events/kafka.service';
import { logger } from './utils/logger';

const PORT = Bun.env.PORT || 3006;

async function startServer() {
  try {
    // Connect to Kafka
    await kafkaService.connect();

    // Start Express server
    app.listen(PORT);
    logger.info(`comment-service running on port ${PORT}`);
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  logger.info('Shutting down gracefully...');
  await kafkaService.disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  logger.info('Shutting down gracefully...');
  await kafkaService.disconnect();
  process.exit(0);
});

startServer();
