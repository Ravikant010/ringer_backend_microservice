#!/bin/bash

# Create Dockerfiles for all microservices
# Usage: ./create-dockerfiles.sh

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🐳 Creating Dockerfiles for all microservices...${NC}"

# Define services and their ports
declare -A SERVICES=(
    ["user-service"]="3001"
    ["post-service"]="3002"
    ["comment-service"]="3003"
    ["chat-service"]="3004"
    ["media-service"]="3005"
    ["notification-service"]="3006"
    ["analytics-service"]="3007"
    ["search-service"]="3008"
)

# Function to create Dockerfile for a service
create_dockerfile() {
    local service_name=$1
    local port=$2
    local service_dir="services/${service_name}"
    local dockerfile_path="${service_dir}/Dockerfile"

    # Create service directory if it doesn't exist
    if [ ! -d "$service_dir" ]; then
        echo -e "${YELLOW}📁 Creating directory: $service_dir${NC}"
        mkdir -p "$service_dir"
    fi

    # Create Dockerfile
    cat > "$dockerfile_path" << EOF
FROM oven/bun:1.0

WORKDIR /app

# Copy package files
COPY package.json bun.lockb* ./

# Install dependencies
RUN bun install --frozen-lockfile

# Copy source code
COPY . .

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \\
  CMD curl -f http://localhost:${port}/health || exit 1

EXPOSE ${port}

CMD ["bun", "run", "src/index.ts"]
EOF

    echo -e "${GREEN}✅ Created Dockerfile for ${service_name} (port ${port})${NC}"
}

# Create .dockerignore for each service
create_dockerignore() {
    local service_name=$1
    local service_dir="services/${service_name}"
    local dockerignore_path="${service_dir}/.dockerignore"

    cat > "$dockerignore_path" << EOF
node_modules
npm-debug.log
.git
.gitignore
README.md
.env
.nyc_output
coverage
.DS_Store
*.log
.vscode
.idea
dist
build
temp
tmp
.cache
.parcel-cache
EOF

    echo -e "${GREEN}✅ Created .dockerignore for ${service_name}${NC}"
}

# Main execution
echo -e "${YELLOW}🚀 Starting Dockerfile generation...${NC}"

for service in "${!SERVICES[@]}"; do
    port=${SERVICES[$service]}
    echo -e "\n${YELLOW}📦 Processing ${service}...${NC}"
    
    create_dockerfile "$service" "$port"
    create_dockerignore "$service"
done

echo -e "\n${GREEN}🎉 All Dockerfiles created successfully!${NC}"
echo -e "${YELLOW}📋 Summary:${NC}"
for service in "${!SERVICES[@]}"; do
    port=${SERVICES[$service]}
    echo -e "  • ${service}: services/${service}/Dockerfile (port ${port})"
done

echo -e "\n${YELLOW}🔥 Next steps:${NC}"
echo -e "  1. Build all images: ${GREEN}docker-compose build${NC}"
echo -e "  2. Run all services: ${GREEN}docker-compose up -d${NC}"
echo -e "  3. Check logs: ${GREEN}docker-compose logs -f${NC}"
