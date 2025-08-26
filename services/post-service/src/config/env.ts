// post-service/src/config/env.ts
import dotenv from 'dotenv';

dotenv.config();

const requiredEnvVars = [
  'PORT',
  'NODE_ENV',
  'DATABASE_URL',
  'USER_SERVICE_URL',
  'JWT_SECRET'
];

const missingVars = requiredEnvVars.filter(varName => !Bun.env[varName]);

if (missingVars.length > 0) {
  console.error(`Missing required environment variables: ${missingVars.join(', ')}`);
  process.exit(1);
}

export const env = {
  port: parseInt(Bun.env.PORT || '3002', 10),
  nodeEnv: Bun.env.NODE_ENV || 'development',
  databaseUrl: Bun.env.DATABASE_URL!,
  userServiceUrl: Bun.env.USER_SERVICE_URL || 'http://localhost:3001',
  jwtSecret: Bun.env.JWT_SECRET!,
  logLevel: Bun.env.LOG_LEVEL || 'info',
  rateLimitPosts: parseInt(Bun.env.RATE_LIMIT_POSTS || '10', 10),
  rateLimitWindow: parseInt(Bun.env.RATE_LIMIT_WINDOW || '3600000', 10) // 1 hour
};