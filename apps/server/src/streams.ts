import type { FastifyInstance } from 'fastify';
import { GoLiveBody, type MatchSummary, type StreamInfo } from '@d11/shared';
import type { Match, Stream, Channel } from '@prisma/client';
import { prisma } from './db';
import { requireUser } from './auth';
import { livekit } from './video/livekit';

const video = livekit;

export const toMatch = (m: Match): MatchSummary => ({
  id: m.id,
  tournament: m.tournament,
  teamA: m.teamA,
  teamB: m.teamB,
  status: m.status as MatchSummary['status'],
  startsAt: m.startsAt.toISOString(),
});

export const toStream = (s: Stream & { channel: Channel; match: Match | null }): StreamInfo => ({
  id: s.id,
  title: s.title,
  language: s.language,
  supportingTeam: s.supportingTeam,
  status: s.status as StreamInfo['status'],
  startedAt: s.startedAt.toISOString(),
  endedAt: s.endedAt?.toISOString() ?? null,
  channel: { id: s.channel.id, displayName: s.channel.displayName, userId: s.channel.userId },
  match: s.match ? toMatch(s.match) : null,
});

const withRefs = { channel: true, match: true } as const;

export async function streamRoutes(app: FastifyInstance) {
  app.get('/api/matches', async () => {
    const matches = await prisma.match.findMany({ orderBy: { startsAt: 'asc' } });
    return { matches: matches.map(toMatch) };
  });

  // Go live: status is 'live' straight away (no webhook in the prototype).
  app.post('/api/streams', { preHandler: requireUser }, async (req, reply) => {
    if (req.user.role !== 'creator' || !req.user.channelId) return reply.code(403).send({ error: 'Creators only' });
    const parsed = GoLiveBody.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: 'Title and match are required' });
    const { title, matchId, supportingTeam, language } = parsed.data;
    // One live stream per channel: close any left over from a closed tab.
    await prisma.stream.updateMany({
      where: { channelId: req.user.channelId, status: 'live' },
      data: { status: 'ended', endedAt: new Date() },
    });
    const stream = await prisma.stream.create({
      data: { channelId: req.user.channelId, matchId, title, language, supportingTeam: supportingTeam || null, status: 'live' },
      include: withRefs,
    });
    await prisma.stream.update({ where: { id: stream.id }, data: { providerRef: stream.id } });
    const token = await video.getPublishToken(stream.id, req.user.id, req.user.name);
    return { stream: toStream(stream), url: video.url, token };
  });

  app.post<{ Params: { id: string } }>('/api/streams/:id/end', { preHandler: requireUser }, async (req, reply) => {
    const s = await prisma.stream.findUnique({ where: { id: req.params.id } });
    if (!s || s.channelId !== req.user.channelId) return reply.code(404).send({ error: 'Stream not found' });
    const stream = await prisma.stream.update({
      where: { id: s.id },
      data: { status: 'ended', endedAt: s.endedAt ?? new Date() },
      include: withRefs,
    });
    return { stream: toStream(stream) };
  });

  app.get<{ Params: { id: string } }>('/api/streams/:id', async (req, reply) => {
    const stream = await prisma.stream.findUnique({ where: { id: req.params.id }, include: withRefs });
    if (!stream) return reply.code(404).send({ error: 'Stream not found' });
    return { stream: toStream(stream) };
  });

  app.get<{ Params: { id: string } }>('/api/streams/:id/token', { preHandler: requireUser }, async (req, reply) => {
    const s = await prisma.stream.findUnique({ where: { id: req.params.id } });
    if (!s || s.status !== 'live') return reply.code(404).send({ error: 'Stream is not live' });
    return { url: video.url, token: await video.getViewerToken(s.id, req.user.id, req.user.name) };
  });
}
