import { Kafka, Producer, Consumer, EachMessagePayload } from 'kafkajs';
import { env } from '../config/env';
import { logger } from '../utils/logger';

class KafkaService {
    private kafka: Kafka;
    private producer: Producer;
    private consumers: Map<string, Consumer> = new Map();

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
        for (const [name, consumer] of this.consumers) {
            await consumer.disconnect();
            logger.info(`Consumer ${name} disconnected`);
        }
    }

    async publishEvent(topic: string, event: any) {
        try {
            await this.producer.send({
                topic,
                messages: [{
                    key: event.postId || event.id,
                    value: JSON.stringify(event),
                    timestamp: Date.now().toString(),
                }],
            });
            logger.info(`Event published to ${topic}:`, event);
        } catch (error) {
            logger.error(`Failed to publish event to ${topic}:`, error);
            throw error;
        }
    }

    async subscribe(
        groupId: string,
        topics: string[],
        handler: (payload: EachMessagePayload) => Promise<void>
    ) {
        const consumer = this.kafka.consumer({ groupId });

        await consumer.connect();
        await consumer.subscribe({ topics, fromBeginning: false });

        await consumer.run({
            eachMessage: async (payload) => {
                try {
                    await handler(payload);
                } catch (error) {
                    logger.error(`Error processing message from ${payload.topic}:`, error);
                }
            },
        });

        this.consumers.set(groupId, consumer);
        logger.info(`Consumer ${groupId} subscribed to topics: ${topics.join(', ')}`);
    }
}

export const kafkaService = new KafkaService();
