# One container: builds the web app, then runs the server, which serves the API, Socket.IO and the built SPA.
FROM node:22-slim
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates && rm -rf /var/lib/apt/lists/* \
  && npm install -g pnpm@9.15.9
WORKDIR /app
COPY . .
RUN pnpm install --frozen-lockfile && pnpm --filter server exec prisma generate && pnpm build
ENV NODE_ENV=production PORT=10000 DATABASE_URL=file:./prod.db
EXPOSE 10000
# migrate deploy + idempotent seed + server (apps/server "start"); the bots and the looping replay start themselves.
CMD ["pnpm", "start"]
