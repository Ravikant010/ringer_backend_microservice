import app from './app';
import { handleCommentCountChange } from './events/consumer';
import { kafkaService } from './events/kafka.service';

import { logger } from './utils/logger';

const PORT = Bun.env.PORT || 3002;

async function startServer() {
  try {
    // 1. Connect Kafka Producer
    await kafkaService.connect();
    logger.info('✅ Kafka producer connected');

    // 2. Subscribe to comment count changes using your subscribe method
    await kafkaService.subscribe(
      'post-service-consumer-group', // Consumer group ID
      ['post.comment_count.changed'], // Topics to subscribe to
      handleCommentCountChange // Handler function
    );
    logger.info('✅ Kafka consumer subscribed to post.comment_count.changed');

    // 3. Start HTTP Server
    app.listen(PORT);
    logger.info(`✅ post-service running on port ${PORT}`);
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
    logger.info('✅ Kafka disconnected');
    process.exit(0);
  } catch (error) {
    logger.error('❌ Error during shutdown:', error);
    process.exit(1);
  }
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

startServer();
