import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import Fastify from 'fastify';
import fastifyStatic from '@fastify/static';
import { Server } from 'socket.io';
import { prisma } from './db';
import { authRoutes } from './auth';
import { streamRoutes } from './streams';
import { setupRealtime } from './realtime';
import { replayRoutes } from './feed/routes';
import { pollRoutes } from './polls';
import { channelRoutes } from './channels';
import { subRoutes } from './subs';

const PORT = Number(process.env.PORT ?? 3001);

const app = Fastify({ logger: { level: 'info' } });

app.get('/api/health', async () => {
  const [users, matches] = await Promise.all([prisma.user.count(), prisma.match.count()]);
  return { ok: true, time: new Date().toISOString(), db: { users, matches } };
});

await app.register(authRoutes);
await app.register(streamRoutes);
await app.register(channelRoutes);
await app.register(subRoutes);

// Socket.IO shares Fastify's HTTP server, so web only needs one proxy target.
const io = new Server(app.server, { path: '/socket.io' });
setupRealtime(io);
await app.register(replayRoutes(io));
await app.register(pollRoutes(io));

// Production: serve the built web app (apps/web/dist) from the same origin, with SPA fallback for page routes.
// In dev it doesn't exist and Vite serves the web app instead.
const webDist = fileURLToPath(new URL('../../web/dist', import.meta.url));
if (existsSync(webDist)) {
  await app.register(fastifyStatic, { root: webDist, wildcard: false });
  app.setNotFoundHandler((req, reply) =>
    req.method === 'GET' && !req.url.startsWith('/api/')
      ? reply.sendFile('index.html')
      : reply.code(404).send({ error: 'Not found' }),
  );
}

await app.listen({ port: PORT, host: '0.0.0.0' });
