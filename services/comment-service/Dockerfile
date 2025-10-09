FROM imbios/bun-node:latest
WORKDIR /app
COPY package.json bun.lockb* ./
RUN bun install
COPY . .
EXPOSE 3003

# Run Drizzle migrations
CMD ["sh", "-c", "\
echo '🔍 Checking for schema changes...' && \
npx drizzle-kit generate && \
if compgen -G \"drizzle/*.sql\" > /dev/null; then \
    echo '📦 Schema changes detected! Applying migrations and push...' && \
    echo '🚀 Running migrations...' && \
    npx drizzle-kit migrate && \
    echo '🔄 Pushing changes...' && \
    npx drizzle-kit push && \
    echo '✅ Migrations and push completed'; \
else \
    echo '✅ No schema changes detected - skipping migrations and push'; \
fi && \
echo '🎯 Starting application...' && \
bun run src/index.ts"]

