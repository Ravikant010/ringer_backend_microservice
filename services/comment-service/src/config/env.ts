// // post-service/src/config/env.ts
// import dotenv from 'dotenv';

// dotenv.config();

// const requiredEnvVars = [
//   'PORT',
//   'NODE_ENV',
//   'DATABASE_URL',
//   'USER_SERVICE_URL',
//   'JWT_SECRET'
// ];

// const missingVars = requiredEnvVars.filter(varName => !Bun.env[varName]);

// if (missingVars.length > 0) {
//   console.error(`Missing required environment variables: ${missingVars.join(', ')}`);
//   process.exit(1);
// }

// export const env = {
//   port: parseInt(Bun.env.PORT || '3002', 10),
//   nodeEnv: Bun.env.NODE_ENV || 'development',
//   databaseUrl: Bun.env.DATABASE_URL!,
//   userServiceUrl: Bun.env.USER_SERVICE_URL || 'http://localhost:3001',
//   jwtSecret: Bun.env.JWT_SECRET!,
//   logLevel: Bun.env.LOG_LEVEL || 'info',
//   rateLimitPosts: parseInt(Bun.env.RATE_LIMIT_POSTS || '10', 10),
//   rateLimitWindow: parseInt(Bun.env.RATE_LIMIT_WINDOW || '3600000', 10), // 1 hour

//   kafkaBrokers: Bun.env.KAFKA_BROKERS || 'redpanda:9092',
//   kafkaClientId: Bun.env.KAFKA_CLIENT_ID || 'post-service'
// };
import dotenv from 'dotenv';

dotenv.config();

const requiredEnvVars = [
  'PORT',
  'NODE_ENV',
  'DATABASE_URL',
  'JWT_SECRET',
  'KAFKA_BROKERS',
  'KAFKA_CLIENT_ID'
];

const missingVars = requiredEnvVars.filter(varName => !Bun.env[varName]);

if (missingVars.length > 0) {
  console.error(`Missing required environment variables: ${missingVars.join(', ')}`);
  process.exit(1);
}

export const env = {
  // Server
  port: parseInt(Bun.env.PORT || '3006', 10),
  nodeEnv: Bun.env.NODE_ENV || 'development',
  serviceName: Bun.env.SERVICE_NAME || 'comment-service',

  // Database
  databaseUrl: Bun.env.DATABASE_URL!,

  // Authentication
  jwtSecret: Bun.env.JWT_SECRET!,
  userServiceUrl: Bun.env.USER_SERVICE_URL || 'http://localhost:3001',

  // Frontend
  frontendUrl: Bun.env.FRONTEND_URL || 'http://localhost:3000',

  // Redis
  redisUrl: Bun.env.REDIS_URL || 'redis://localhost:6379',

  // Kafka
  kafkaBrokers: Bun.env.KAFKA_BROKERS || 'localhost:9092',
  kafkaClientId: Bun.env.KAFKA_CLIENT_ID || 'comment-service',

  // Logging
  logLevel: Bun.env.LOG_LEVEL || 'info',

  // Pagination
  defaultPageLimit: parseInt(Bun.env.DEFAULT_PAGE_LIMIT || '20', 10),
  maxPageLimit: parseInt(Bun.env.MAX_PAGE_LIMIT || '50', 10),
};
