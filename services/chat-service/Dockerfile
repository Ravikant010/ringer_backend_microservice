FROM imbios/bun-node:latest
WORKDIR /app
COPY package.json bun.lockb* ./
RUN bun install
COPY . .

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3004/health || exit 1

EXPOSE 3004

# Run Drizzle migrations
CMD ["sh", "-c", "\
echo '🔍 Generating migration files...' && \
npx drizzle-kit generate && \
echo '🚀 Running migrations...' && \
npx drizzle-kit push && \
echo '✅ Migrations completed' && \
echo '🎯 Starting application...' && \
bun run src/index.ts"]

