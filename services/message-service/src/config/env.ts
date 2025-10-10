import { config } from 'dotenv';

config();

export const env = {
  port: parseInt(process.env.PORT || '3008'),
  nodeEnv: process.env.NODE_ENV || 'development',
  serviceName: process.env.SERVICE_NAME || 'message-service',
  databaseUrl: process.env.DATABASE_URL!,
  jwtSecret: process.env.JWT_SECRET || 'your-secret-key',
  kafkaBrokers: process.env.KAFKA_BROKERS || 'localhost:9092',
  kafkaClientId: process.env.KAFKA_CLIENT_ID || 'message-service',
  userServiceUrl: process.env.USER_SERVICE_URL || 'http://localhost:3001',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
};
