FROM oven/bun:latest


WORKDIR /app

# Copy package files
COPY package.json bun.lockb* ./

# Install dependencies
RUN bun install --frozen-lockfile

# Copy source code
COPY . .

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3007/health || exit 1

EXPOSE 3007

# Run Drizzle migrations
CMD ["sh", "-c", "\
echo '🔍 Generating migration files...' && \
npx drizzle-kit generate && \
echo '🚀 Running migrations...' && \
npx drizzle-kit migrate && \
echo '✅ Migrations completed' && \
echo '🎯 Starting application...' && \
bun run src/index.ts"]
