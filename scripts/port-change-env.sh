#!/bin/bash

# Map services to their expected PORT values
declare -A service_ports=(
  ["user-service"]=3001
  ["post-service"]=3002
  ["comment-service"]=3003
  ["chat-service"]=3004
  ["media-service"]=3005
  ["notification-service"]=3006
  ["analytics-service"]=3007
  ["search-service"]=3008
)

for service in "${!service_ports[@]}"; do
  env_file="services/$service/.env"
  port="${service_ports[$service]}"

  if [[ ! -f "$env_file" ]]; then
    echo "⚠️  $env_file not found. Skipping..."
    continue
  fi

  # Check if PORT is already set
  if grep -q "^PORT=" "$env_file"; then
    sed -i "s/^PORT=.*/PORT=$port/" "$env_file"
    echo "🔄 Updated $service: PORT=$port in $env_file"
  else
    echo "PORT=$port" >> "$env_file"
    echo "➕ Added $service: PORT=$port to $env_file"
  fi
done

echo "🎉 All service .env files updated with correct PORT values!"