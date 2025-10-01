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
CMD ["sh", "-c", "\
npx drizzle-kit generate && \
npx drizzle-kit migrate && \
npx drizzle-kit push && \
bun run src/index.ts"]
