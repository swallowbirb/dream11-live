import Fastify from 'fastify';
import { Server } from 'socket.io';
import { prisma } from './db';
import { authRoutes } from './auth';
import { streamRoutes } from './streams';
import { setupRealtime } from './realtime';
import { replayRoutes } from './feed/routes';
import { pollRoutes } from './polls';
import { channelRoutes } from './channels';

const PORT = Number(process.env.PORT ?? 3001);

const app = Fastify({ logger: { level: 'info' } });

app.get('/api/health', async () => {
  const [users, matches] = await Promise.all([prisma.user.count(), prisma.match.count()]);
  return { ok: true, time: new Date().toISOString(), db: { users, matches } };
});

await app.register(authRoutes);
await app.register(streamRoutes);
await app.register(channelRoutes);

// Socket.IO shares Fastify's HTTP server, so web only needs one proxy target.
const io = new Server(app.server, { path: '/socket.io' });
setupRealtime(io);
await app.register(replayRoutes(io));
await app.register(pollRoutes(io));

await app.listen({ port: PORT, host: '0.0.0.0' });
