#!/bin/bash

set -e

# Define new services to create
new_services=("social-service" "message-service")

# Port mapping
declare -A service_ports
service_ports["social-service"]=3004
service_ports["message-service"]=3008

echo "🚀 Creating new microservices..."

for service in "${new_services[@]}"; do
    echo ""
    echo "📦 Setting up $service..."
    
    # Create service directory
    mkdir -p "services/$service"
    cd "services/$service"
    
    # Create package.json
    cat > package.json << EOL
{
  "name": "$service",
  "version": "1.0.0",
  "private": true,
  "main": "src/index.ts",
  "scripts": {
    "dev": "bun --watch src/index.ts",
    "build": "bun build src/index.ts --outdir=dist --target=bun",
    "start": "bun run dist/index.js",
    "db:generate": "drizzle-kit generate",
    "db:migrate": "bun src/database/migrate.ts",
    "db:push": "drizzle-kit push",
    "db:studio": "drizzle-kit studio"
  },
  "dependencies": {
    "express": "^4.18.2",
    "drizzle-orm": "^0.29.3",
    "postgres": "^3.4.3",
    "kafkajs": "^2.2.4",
    "zod": "^3.22.4",
    "jsonwebtoken": "^9.0.2",
    "cors": "^2.8.5",
    "helmet": "^7.1.0",
    "dotenv": "^16.3.1"
  },
  "devDependencies": {
    "@types/express": "^4.17.21",
    "@types/node": "^20.10.6",
    "@types/cors": "^2.8.17",
    "@types/jsonwebtoken": "^9.0.5",
    "drizzle-kit": "^0.20.9",
    "bun-types": "latest"
  }
}
EOL

    # Create TypeScript config
    cat > tsconfig.json << EOL
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "lib": ["ES2022"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "allowSyntheticDefaultImports": true,
    "types": ["bun-types"]
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
EOL

    # Create Drizzle config
    cat > drizzle.config.ts << EOL
import type { Config } from 'drizzle-kit';
import { config } from 'dotenv';

config();

export default {
  schema: './src/database/schema.ts',
  out: './drizzle',
  driver: 'pg',
  dbCredentials: {
    connectionString: process.env.DATABASE_URL!,
  },
} satisfies Config;
EOL

    # Create .env.example
    cat > .env.example << EOL
# Database
DATABASE_URL=postgresql://${service}_user:password@localhost:5432/${service}_db

# JWT
JWT_SECRET=your-jwt-secret-here

# Service Config
PORT=${service_ports[$service]}
NODE_ENV=development
SERVICE_NAME=$service

# Kafka
KAFKA_BROKERS=localhost:9092
KAFKA_CLIENT_ID=$service

# Other Services
USER_SERVICE_URL=http://localhost:3001

# CORS
FRONTEND_URL=http://localhost:5173
EOL

    # Create .env (copy from example)
    cp .env.example .env

    # Create directory structure
    mkdir -p src/{controllers,repositories,routes,database,middleware,events,config,utils}
    mkdir -p drizzle

    # Create database index
    cat > src/database/index.ts << EOL
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

const connectionString = process.env.DATABASE_URL!;

const client = postgres(connectionString);
export const db = drizzle(client);
EOL

    # Create database migration runner
    cat > src/database/migrate.ts << EOL
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';

const connectionString = process.env.DATABASE_URL!;

async function main() {
  const connection = postgres(connectionString, { max: 1 });
  const db = drizzle(connection);

  console.log('Running migrations...');
  await migrate(db, { migrationsFolder: './drizzle' });
  console.log('✅ Migrations complete!');

  await connection.end();
}

main().catch((err) => {
  console.error('❌ Migration failed:', err);
  process.exit(1);
});
EOL

    # Create env config
    cat > src/config/env.ts << EOL
import { config } from 'dotenv';

config();

export const env = {
  port: parseInt(process.env.PORT || '${service_ports[$service]}'),
  nodeEnv: process.env.NODE_ENV || 'development',
  serviceName: process.env.SERVICE_NAME || '$service',
  databaseUrl: process.env.DATABASE_URL!,
  jwtSecret: process.env.JWT_SECRET || 'your-secret-key',
  kafkaBrokers: process.env.KAFKA_BROKERS || 'localhost:9092',
  kafkaClientId: process.env.KAFKA_CLIENT_ID || '$service',
  userServiceUrl: process.env.USER_SERVICE_URL || 'http://localhost:3001',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
};
EOL

    # Create logger utility
    cat > src/utils/logger.ts << EOL
type LogLevel = 'info' | 'warn' | 'error' | 'debug';

class Logger {
  private serviceName: string;

  constructor(serviceName: string) {
    this.serviceName = serviceName;
  }

  private log(level: LogLevel, message: string, meta?: any) {
    const timestamp = new Date().toISOString();
    const logObject = {
      timestamp,
      level,
      service: this.serviceName,
      message,
      ...(meta && { meta }),
    };
    console.log(JSON.stringify(logObject));
  }

  info(message: string, meta?: any) {
    this.log('info', message, meta);
  }

  warn(message: string, meta?: any) {
    this.log('warn', message, meta);
  }

  error(message: string, meta?: any) {
    this.log('error', message, meta);
  }

  debug(message: string, meta?: any) {
    this.log('debug', message, meta);
  }
}

export const logger = new Logger(process.env.SERVICE_NAME || '$service');
EOL

    # Create auth middleware
    cat > src/middleware/auth.ts << EOL
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';

export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    email: string;
  };
}

export function authenticateToken(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Access token required',
    });
  }

  try {
    const decoded = jwt.verify(token, env.jwtSecret) as any;
    req.user = {
      userId: decoded.userId || decoded.id,
      email: decoded.email,
    };
    next();
  } catch (error) {
    return res.status(403).json({
      success: false,
      error: 'Invalid or expired token',
    });
  }
}
EOL

    # Create Kafka service
    cat > src/events/kafka.service.ts << EOL
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
    this.consumer = this.kafka.consumer({ groupId: \`\${env.serviceName}-group\` });
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
      logger.info(\`Event published to \${topic}\`, event);
    } catch (error) {
      logger.error(\`Failed to publish event to \${topic}\`, error);
      throw error;
    }
  }
}

export const kafkaService = new KafkaService();
EOL

    # Create Kafka types
    cat > src/events/types.ts << EOL
export const TOPICS = {
  // Add your topics here
} as const;

// Add your event interfaces here
EOL

    # Create Express app
    cat > src/app.ts << EOL
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config/env';

const app = express();

// Middleware
app.use(helmet());
app.use(cors({ origin: env.frontendUrl, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: env.serviceName });
});

// Routes
// TODO: Import and use your routes here

export default app;
EOL

    # Create main index.ts
    cat > src/index.ts << EOL
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
      logger.info(\`✅ \${env.serviceName} running on port \${env.port}\`);
    });
  } catch (error) {
    logger.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
async function shutdown(signal: string) {
  logger.info(\`\${signal} received, shutting down gracefully...\`);
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
EOL

    # Create .gitignore
    cat > .gitignore << EOL
node_modules
dist
.env
*.log
.DS_Store
drizzle/*.sql
EOL

    cd ../..
    echo "✅ $service created successfully!"
done

echo ""
echo "🎉 All services created!"
echo ""
echo "📝 Next steps:"
echo "1. cd services/social-service && bun install"
echo "2. cd services/message-service && bun install"
echo "3. Create databases:"
echo "   createdb social_service_db"
echo "   createdb message_service_db"
echo "4. Run migrations: bun run db:generate && bun run db:migrate"
echo "5. Start services: bun run dev"
