import type { FastifyInstance } from 'fastify';
import type { Server } from 'socket.io';
import { EV, type Score, type ScoreUpdate } from '@d11/shared';
import { prisma } from '../db';
import { roomOf } from '../realtime';
import type { MatchFeed } from './feed';

/** score:update fan-out to every live stream room linked to the match. */
export const scoreFanOut = (io: Server) => async (matchId: string, score: Score) => {
  const streams = await prisma.stream.findMany({ where: { matchId, status: 'live' }, select: { id: true } });
  const update: ScoreUpdate = { matchId, score };
  for (const s of streams) io.to(roomOf(s.id)).emit(EV.scoreUpdate, update);
};

/** Replay control (no auth: local prototype). */
export const replayRoutes = (feed: MatchFeed) => async (app: FastifyInstance) => {
  app.get('/api/replay', async () => feed.status());
  app.post<{ Body: { speed?: number } | undefined }>('/api/replay/start', async (req) => {
    const speed = Number(req.body?.speed) || 10;
    return feed.start(speed);
  });
  app.post('/api/replay/stop', async () => feed.stop());
};
