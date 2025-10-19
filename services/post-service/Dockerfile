FROM imbios/bun-node:latest
WORKDIR /app
COPY package.json bun.lockb* ./
RUN bun install
COPY . .
EXPOSE 3001
# Run Drizzle migrations
# RUN bun drizzle-kit introspect || true
# RUN bun drizzle-kit generate || true
# RUN bun drizzle-kit migrate || true
# RUN bun drizzle-kit push || true
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
