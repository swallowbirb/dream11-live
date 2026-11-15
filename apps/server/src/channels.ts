import type { FastifyInstance } from 'fastify';
import type { ChannelInfo } from '@d11/shared';
import type { Channel, User } from '@prisma/client';
import { prisma } from './db';
import { requireUser } from './auth';
import { toLive, withRefs } from './streams';

type Row = Channel & { user: Pick<User, 'bio'>; _count: { followers: number } };
const rowInclude = { user: { select: { bio: true } }, _count: { select: { followers: true } } } as const;

async function toChannel(c: Row, viewerId: string, following?: boolean): Promise<ChannelInfo> {
  const [live, f] = await Promise.all([
    prisma.stream.findFirst({ where: { channelId: c.id, status: 'live' }, include: withRefs, orderBy: { startedAt: 'desc' } }),
    following === undefined
      ? prisma.follow.findUnique({ where: { followerId_channelId: { followerId: viewerId, channelId: c.id } } })
      : null,
  ]);
  return {
    id: c.id,
    userId: c.userId,
    displayName: c.displayName,
    bio: c.user.bio,
    tags: JSON.parse(c.tags || '[]'),
    favouriteTeam: c.favouriteTeam,
    followerCount: c._count.followers,
    following: following ?? !!f,
    live: live ? toLive(live) : null,
  };
}

export async function channelRoutes(app: FastifyInstance) {
  app.get<{ Params: { id: string } }>('/api/channels/:id', { preHandler: requireUser }, async (req, reply) => {
    const c = await prisma.channel.findUnique({ where: { id: req.params.id }, include: rowInclude });
    if (!c) return reply.code(404).send({ error: 'Channel not found' });
    return { channel: await toChannel(c, req.user.id) };
  });

  app.post<{ Params: { id: string } }>('/api/channels/:id/follow', { preHandler: requireUser }, async (req, reply) => {
    const c = await prisma.channel.findUnique({ where: { id: req.params.id } });
    if (!c || c.userId === req.user.id) return reply.code(400).send({ error: "Can't follow that channel" });
    const key = { followerId: req.user.id, channelId: c.id };
    await prisma.follow.upsert({ where: { followerId_channelId: key }, create: key, update: {} });
    return { ok: true };
  });

  app.delete<{ Params: { id: string } }>('/api/channels/:id/follow', { preHandler: requireUser }, async (req) => {
    await prisma.follow.deleteMany({ where: { followerId: req.user.id, channelId: req.params.id } });
    return { ok: true };
  });

  // Followed channels, live ones first (most viewers first), then offline by name.
  app.get('/api/me/following', { preHandler: requireUser }, async (req) => {
    const rows = await prisma.follow.findMany({ where: { followerId: req.user.id }, include: { channel: { include: rowInclude } } });
    const channels = await Promise.all(rows.map((r) => toChannel(r.channel, req.user.id, true)));
    channels.sort(
      (a, b) =>
        Number(!!b.live) - Number(!!a.live) ||
        (b.live?.viewerCount ?? 0) - (a.live?.viewerCount ?? 0) ||
        a.displayName.localeCompare(b.displayName),
    );
    return { channels };
  });
}
