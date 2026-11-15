import type { FastifyInstance } from 'fastify';
import type { Server } from 'socket.io';
import { EV, type ScoreUpdate } from '@d11/shared';
import { prisma } from '../db';
import { roomOf } from '../realtime';
import { ReplayFeed } from './replay';

/** Replay control (no auth: local prototype) and the score:update fan-out to linked stream rooms. */
export const replayRoutes = (io: Server) => async (app: FastifyInstance) => {
  const feed = new ReplayFeed(new URL('../../replays/ind-aus.json', import.meta.url), async (matchId, score) => {
    const streams = await prisma.stream.findMany({ where: { matchId, status: 'live' }, select: { id: true } });
    const update: ScoreUpdate = { matchId, score };
    for (const s of streams) io.to(roomOf(s.id)).emit(EV.scoreUpdate, update);
  });

  app.get('/api/replay', async () => feed.status());
  app.post<{ Body: { speed?: number } | undefined }>('/api/replay/start', async (req) => {
    const speed = Number(req.body?.speed) || 10;
    return feed.start(speed);
  });
  app.post('/api/replay/stop', async () => feed.stop());
};
