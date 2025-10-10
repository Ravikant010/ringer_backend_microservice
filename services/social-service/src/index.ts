import app from './app';
import { env } from './config/env';
import { kafkaService } from './events/kafka.service';
import { logger } from './utils/logger';

async function startServer() {
  try {
    // Connect to Kafka
    await kafkaService.connect();
    logger.info('✅ Kafka connected');

    // Start HTTP server
    app.listen(env.port, () => {
      logger.info(`✅ ${env.serviceName} running on port ${env.port}`);
    });
  } catch (error) {
    logger.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
async function shutdown(signal: string) {
  logger.info(`${signal} received, shutting down gracefully...`);
  try {
    await kafkaService.disconnect();
    process.exit(0);
  } catch (error) {
    logger.error('Error during shutdown:', error);
    process.exit(1);
  }
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

startServer();
