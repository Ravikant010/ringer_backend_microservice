#!/bin/bash

set -e

services=("user_service" "post_service" "comment_service" "chat_service" "media_service" "notification_service" "analytics_service" "search_service")

for service in "${services[@]}"; do
    echo "Setting up $service..."
    
    cd "services/$service"
    
    # Create package.json
    cat > package.json << EOL
{
  "name": "$service",
  "version": "1.0.0",
  "private": true,
  "main": "dist/index.js",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "lint": "eslint src/**/*.ts",
    "lint:fix": "eslint src/**/*.ts --fix",
    "db:generate": "drizzle-kit generate",
    "db:migrate": "tsx src/database/migrate.ts",
    "db:seed": "tsx src/database/seed.ts",
    "db:studio": "drizzle-kit studio"
  }
}
EOL

    # Create TypeScript config
    cat > tsconfig.json << EOL
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "commonjs",
    "lib": ["ES2022"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
EOL

    # Create environment example
    cat > .env.example << EOL
# Database
DATABASE_URL=postgresql://${service}_user:peter435@localhost:5432/${service}_db

# JWT
JWT_SECRET=your-jwt-secret-here
JWT_REFRESH_SECRET=your-jwt-refresh-secret-here

# Redis
REDIS_URL=redis://localhost:6379

# Service Config
PORT=300$((${#service} % 10 + 1))
NODE_ENV=development
SERVICE_NAME=$service
SERVICE_VERSION=1.0.0
LOG_LEVEL=info

# CORS
FRONTEND_URL=http://localhost:3000
EOL

    # Create basic directory structure
    mkdir -p src/{controllers,services,routes,database,middleware}
    
    # Create basic index.ts
    cat > src/index.ts << EOL
import { logger } from './utils/logger'

const PORT = process.env.PORT || 300$((${#service} % 10 + 1))

async function startServer() {
  try {
    // TODO: Import and start your app here
    logger.info(\`$service running on port \${PORT}\`)
  } catch (error) {
    logger.error('Failed to start server:', error)
    process.exit(1)
  }
}

startServer()
EOL

    # Create logger utility
    mkdir -p src/utils
    cat > src/utils/logger.ts << EOL
import winston from 'winston'

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { 
    service: process.env.SERVICE_NAME || '$service'
  },
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
})
EOL

    cd ../..
    echo "✅ $service setup complete"
done

echo "🎉 All services setup complete!"
