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
  CMD curl -f http://localhost:3004/health || exit 1

EXPOSE 3004

# Run Drizzle migrations
RUN bun drizzle-kit introspect || true
RUN bun drizzle-kit generate || true
RUN bun drizzle-kit migrate || true
RUN bun drizzle-kit push || true
CMD ["bun", "run", "src/index.ts"]
