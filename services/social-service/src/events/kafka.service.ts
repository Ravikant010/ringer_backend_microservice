import { Kafka, Producer, Consumer } from 'kafkajs';
import { env } from '../config/env';
import { logger } from '../utils/logger';

class KafkaService {
  private kafka: Kafka;
  public producer: Producer;
  public consumer: Consumer;

  constructor() {
    this.kafka = new Kafka({
      clientId: env.kafkaClientId,
      brokers: env.kafkaBrokers.split(','),
      retry: {
        retries: 8,
        initialRetryTime: 100,
        multiplier: 2,
      },
    });
    this.producer = this.kafka.producer();
    this.consumer = this.kafka.consumer({ groupId: `${env.serviceName}-group` });
  }

  async connect() {
    try {
      await this.producer.connect();
      logger.info('Kafka producer connected');
    } catch (error) {
      logger.error('Failed to connect Kafka producer:', error);
      throw error;
    }
  }

  async disconnect() {
    await this.producer.disconnect();
    await this.consumer.disconnect();
  }

  async publishEvent(topic: string, event: any) {
    try {
      await this.producer.send({
        topic,
        messages: [{
          key: event.id || event.userId,
          value: JSON.stringify(event),
          timestamp: Date.now().toString(),
        }],
      });
      logger.info(`Event published to ${topic}`, event);
    } catch (error) {
      logger.error(`Failed to publish event to ${topic}`, error);
      throw error;
    }
  }
}

export const kafkaService = new KafkaService();
