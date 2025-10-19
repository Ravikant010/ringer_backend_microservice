# FROM oven/bun:1.0

# WORKDIR /app

# # Copy package files
# COPY package.json bun.lockb* ./

# # Install dependencies
# RUN bun install 
# # Copy source code
# COPY . .

# # Health check
# HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
#   CMD curl -f http://localhost:3001/health || exit 1

# EXPOSE 3001

# # Run Drizzle migrations
# RUN bun drizzle-kit introspect || true
# RUN bun drizzle-kit generate || true
# RUN bun drizzle-kit migrate || true
# RUN bun drizzle-kit push || true

# CMD ["bun", "run", "src/index.ts"]
# FROM imbios/bun-node:latest
# WORKDIR /app
# COPY . .
# RUN bun install
# EXPOSE 3001

# RUN npx drizzle-kit generate 
# RUN npx drizzle-kit migrate 
# RUN npx drizzle-kit push 
# CMD ["bun", "run", "src/index.ts"]


# FROM imbios/bun-node:latest
# WORKDIR /app
# COPY package.json bun.lockb* ./
# RUN bun install
# COPY . .
# EXPOSE 3001

# CMD ["sh", "-c", "\
# npx drizzle-kit generate && \
# npx drizzle-kit migrate && \
# npx drizzle-kit push && \
# bun run src/index.ts"]
FROM imbios/bun-node:latest
WORKDIR /app
COPY package.json bun.lockb* ./
RUN bun install
COPY . .
EXPOSE 3001

# CMD ["sh", "-c", "\
# echo '🔍 Checking for schema changes...' && \
# npx drizzle-kit generate && \
# if compgen -G \"drizzle/*.sql\" > /dev/null; then \
#     echo '📦 Schema changes detected! Applying migrations and push...' && \
#     echo '🚀 Running migrations...' && \
#     npx drizzle-kit migrate && \
#     echo '🔄 Pushing changes...' && \
#     npx drizzle-kit push && \
#     echo '✅ Migrations and push completed'; \
# else \
#     echo '✅ No schema changes detected - skipping migrations and push'; \
# fi && \
# echo '🎯 Starting application...' && \
# bun run src/index.ts"]

CMD ["sh", "-c", "\
echo '🔍 Generating migration files...' && \
npx drizzle-kit generate && \
echo '🚀 Running migrations...' && \
npx drizzle-kit migrate && \
echo '✅ Migrations completed' && \
echo '🎯 Starting application...' && \
bun run src/index.ts"]
