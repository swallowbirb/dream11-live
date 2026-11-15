import type { FastifyInstance } from 'fastify';
import { GoLiveBody, type LiveStream, type MatchListItem, type MatchSummary, type Score, type StreamInfo } from '@d11/shared';
import type { Match, Stream, Channel } from '@prisma/client';
import { prisma } from './db';
import { requireUser } from './auth';
import { livekit } from './video/livekit';
import { notifyFollowers, viewerCount } from './realtime';

const video = livekit;

export const toMatch = (m: Match): MatchSummary => ({
  id: m.id,
  tournament: m.tournament,
  teamA: m.teamA,
  teamB: m.teamB,
  status: m.status as MatchSummary['status'],
  startsAt: m.startsAt.toISOString(),
  score: parseScore(m.scoreJson),
});

// scoreJson is "{}" until the feed writes the first ball.
function parseScore(json: string): Score | null {
  const s = JSON.parse(json || '{}');
  return Array.isArray(s.batters) ? (s as Score) : null;
}

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
  bot: botMedia(s.providerRef),
});

// Bot streams store "bot:<match clip>,<cam clip>" in providerRef (see bots/director.ts).
function botMedia(ref: string | null): StreamInfo['bot'] {
  if (!ref?.startsWith('bot:')) return null;
  const [match, cam] = ref.slice(4).split(',');
  return { match: `/bots/${match}`, cam: `/bots/${cam}` };
}

export const withRefs = { channel: true, match: true } as const;

export const toLive = (s: Stream & { channel: Channel; match: Match | null }): LiveStream => ({
  ...toStream(s),
  viewerCount: viewerCount(s.id, s.channel.userId),
});

async function liveStreams(matchId?: string): Promise<LiveStream[]> {
  const rows = await prisma.stream.findMany({
    where: { status: 'live', ...(matchId && { matchId }) },
    include: withRefs,
    orderBy: { startedAt: 'desc' },
  });
  return rows
    .map(toLive)
    .sort((a, b) => b.viewerCount - a.viewerCount);
}

export async function streamRoutes(app: FastifyInstance) {
  app.get('/api/matches', async () => {
    const [matches, counts] = await Promise.all([
      prisma.match.findMany({ orderBy: { startsAt: 'asc' } }),
      prisma.stream.groupBy({ by: ['matchId'], where: { status: 'live' }, _count: true }),
    ]);
    const live = new Map(counts.map((c) => [c.matchId, c._count]));
    const list: MatchListItem[] = matches.map((m) => ({ ...toMatch(m), liveCount: live.get(m.id) ?? 0 }));
    return { matches: list };
  });

  app.get<{ Params: { id: string } }>('/api/matches/:id', async (req, reply) => {
    const m = await prisma.match.findUnique({ where: { id: req.params.id } });
    if (!m) return reply.code(404).send({ error: 'Match not found' });
    const streams = await liveStreams(m.id);
    const match: MatchListItem = { ...toMatch(m), liveCount: streams.length };
    return { match, streams };
  });

  app.get<{ Querystring: { match?: string } }>('/api/streams/live', async (req) => ({
    streams: await liveStreams(req.query.match),
  }));

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
    const info = toStream(stream);
    await notifyFollowers(req.user.channelId, { type: 'live', stream: info });
    return { stream: info, url: video.url, token };
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
    if (!s || s.status !== 'live' || s.providerRef?.startsWith('bot:')) return reply.code(404).send({ error: 'Stream is not live' });
    return { url: video.url, token: await video.getViewerToken(s.id, req.user.id, req.user.name) };
  });
}
