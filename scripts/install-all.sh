#!/bin/bash

set -e

echo "🚀 Installing Social Platform Backend Dependencies..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}📦 $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Install root dependencies
print_status "Installing root dependencies..."
bun install
print_success "Root dependencies installed"

# Install shared dependencies
print_status "Installing shared dependencies..."
cd shared
bun install
cd ..
print_success "Shared dependencies installed"

# Function to install service dependencies
install_service() {
    local service_name=$1
    print_status "Installing $service_name dependencies..."
    
    cd "services/$service_name"
    
    # Create package.json if it doesn't exist
    if [ ! -f "package.json" ]; then
        bun init -y
    fi
    
    # Install core dependencies (common to all services)
    bun add express cors helmet express-rate-limit bcryptjs jsonwebtoken zod drizzle-orm drizzle-kit postgres winston ioredis express-validator morgan cookie-parser  dotenv
    
    # Install dev dependencies (common to all services)
    bun add -D typescript @types/node @types/express @types/cors @types/bcryptjs @types/jsonwebtoken tsx nodemon eslint jest @types/jest supertest @types/supertest @types/pg drizzle-zod @types/cookie-parser 
    
    # Service-specific dependencies
    case $service_name in
        "user-service")
            bun add cookie-parser  
            bun add -D @types/cookie-parser 
            ;;
        "analytics-service")
            bun add cookie-parser  
            bun add -D @types/cookie-parser 
            ;;

        "post-service")
            bun add multer sharp 
            bun add -D @types/multer
            ;;
        "chat-service")
            bun add socket.io 
            bun add -D @types/socket.io
            ;;
        "media-service")
            bun add multer sharp aws-sdk 
            bun add -D @types/multer @types/aws-sdk
            ;;
        "notification-service")
            bun add nodemailer web-push 
            bun add -D @types/nodemailer @types/web-push
            ;;
        "search-service")
            bun add elasticsearch 
            bun add -D @types/elasticsearch
            ;;
    esac
    
    cd ../..
    print_success "$service_name dependencies installed"
}

# Install for all services
# services=("user_service" "post_service" "comment_service" "chat_service" "media_service" "notification_service" "analytics_service" "search_service")
services=("user-service" "post-service" "comment-service" "chat-service" "media-service" "notification-service" "analytics-service" "search-service")
for service in "${services[@]}"; do
    install_service $service
done

print_success "All dependencies installed successfully! 🎉"
echo ""
echo "Next steps:"
echo "1. Copy .env.example to .env in each service directory"
echo "2. Update environment variables"
echo "3. Start databases: docker-compose up -d"
echo "4. Run migrations: npm run db:migrate"
echo "5. Start development: npm run dev"
