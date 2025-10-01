#!/bin/bash
# add-drizzle-commands.sh

services=("user-service" "post-service" "comment-service" "chat-service" "media-service" "notification-service" "analytics-service" "search-service")

for service in "${services[@]}"; do
    # Add migration commands before CMD
    sed -i '/^CMD/i\
# Run Drizzle migrations\
RUN bun drizzle-kit introspect || true\
RUN bun drizzle-kit generate || true\
RUN bun drizzle-kit migrate || true\
RUN bun drizzle-kit push || true' "services/$service/Dockerfile"
    
    echo "✅ Added Drizzle commands to $service"
done

echo "🎉 All Dockerfiles updated!"
