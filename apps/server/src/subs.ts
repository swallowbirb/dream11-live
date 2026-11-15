import type { FastifyInstance } from 'fastify';
import { SubscribeBody, type TiersResponse } from '@d11/shared';
import { prisma } from './db';
import { requireUser } from './auth';

async function tiersFor(channelId: string, userId: string): Promise<TiersResponse> {
  const [tiers, sub] = await Promise.all([
    prisma.subTier.findMany({ where: { channelId }, orderBy: { rank: 'asc' } }),
    prisma.subscription.findFirst({ where: { channelId, userId, status: 'active' }, orderBy: { createdAt: 'desc' } }),
  ]);
  return {
    tiers: tiers.map(({ id, name, displayPrice, perks, rank }) => ({ id, name, displayPrice, perks, rank })),
    mySub: sub ? { tierId: sub.tierId, since: sub.createdAt.toISOString() } : null,
  };
}

/** Mock subscriptions: no payment, recorded immediately. One active sub per user and channel. */
export async function subRoutes(app: FastifyInstance) {
  app.get<{ Params: { id: string } }>('/api/channels/:id/tiers', { preHandler: requireUser }, async (req) =>
    tiersFor(req.params.id, req.user.id),
  );

  app.post<{ Params: { id: string } }>('/api/channels/:id/subscribe', { preHandler: requireUser }, async (req, reply) => {
    const parsed = SubscribeBody.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: 'Pick a tier' });
    const tier = await prisma.subTier.findUnique({ where: { id: parsed.data.tierId }, include: { channel: true } });
    if (!tier || tier.channelId !== req.params.id) return reply.code(404).send({ error: 'Tier not found' });
    if (tier.channel.userId === req.user.id) return reply.code(400).send({ error: "You can't subscribe to yourself" });
    const where = { channelId: tier.channelId, userId: req.user.id, status: 'active' };
    await prisma.subscription.updateMany({ where, data: { status: 'cancelled' } });
    await prisma.subscription.create({ data: { channelId: tier.channelId, userId: req.user.id, tierId: tier.id } });
    return tiersFor(tier.channelId, req.user.id);
  });

  app.delete<{ Params: { id: string } }>('/api/channels/:id/subscribe', { preHandler: requireUser }, async (req) => {
    await prisma.subscription.updateMany({
      where: { channelId: req.params.id, userId: req.user.id, status: 'active' },
      data: { status: 'cancelled' },
    });
    return tiersFor(req.params.id, req.user.id);
  });
}
