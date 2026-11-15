import type { FastifyInstance } from 'fastify';
import type { Server, Socket } from 'socket.io';
import { EV, PollCreate, PollVoteBody, type PollState, type PollUpdate } from '@d11/shared';
import { prisma } from './db';
import { requireUser } from './auth';
import { roomOf } from './rooms';

async function pollState(pollId: string): Promise<PollState | null> {
  const p = await prisma.poll.findUnique({ where: { id: pollId } });
  if (!p) return null;
  const options: string[] = JSON.parse(p.optionsJson);
  const groups = await prisma.pollVote.groupBy({ by: ['optionIndex'], where: { pollId }, _count: true });
  const counts = options.map((_, i) => groups.find((g) => g.optionIndex === i)?._count ?? 0);
  return {
    id: p.id,
    streamId: p.streamId,
    question: p.question,
    options,
    counts,
    total: counts.reduce((a, n) => a + n, 0),
    status: p.status as PollState['status'],
  };
}

export async function broadcast(io: Server, pollId: string) {
  const poll = await pollState(pollId);
  if (poll) io.to(roomOf(poll.streamId)).emit(EV.pollUpdate, { streamId: poll.streamId, poll } satisfies PollUpdate);
  return poll;
}

/** On room:join: the stream's open poll (if any) to the joiner, with their vote. */
export async function pollJoin(socket: Socket, streamId: string, userId: string) {
  const open = await prisma.poll.findFirst({ where: { streamId, status: 'open' }, orderBy: { createdAt: 'desc' } });
  if (!open) return;
  const [poll, vote] = await Promise.all([
    pollState(open.id),
    prisma.pollVote.findUnique({ where: { pollId_userId: { pollId: open.id, userId } } }),
  ]);
  if (poll) socket.emit(EV.pollUpdate, { streamId, poll, myVote: vote?.optionIndex ?? null } satisfies PollUpdate);
}

export function pollSockets(io: Server, socket: Socket, userId: string) {
  socket.on(EV.pollVote, async (payload: unknown) => {
    const parsed = PollVoteBody.safeParse(payload);
    if (!parsed.success) return;
    const { pollId, optionIndex } = parsed.data;
    const p = await prisma.poll.findUnique({ where: { id: pollId } });
    if (!p || p.status !== 'open' || !socket.rooms.has(roomOf(p.streamId))) return;
    if (optionIndex >= JSON.parse(p.optionsJson).length) return;
    const existing = await prisma.pollVote.findUnique({ where: { pollId_userId: { pollId, userId } } });
    if (!existing) await prisma.pollVote.create({ data: { pollId, userId, optionIndex } });
    const poll = await broadcast(io, pollId);
    if (poll) socket.emit(EV.pollUpdate, { streamId: poll.streamId, poll, myVote: existing?.optionIndex ?? optionIndex } satisfies PollUpdate);
  });
}

/** Opens a poll on a stream, closing any open one first. */
export async function openPoll(io: Server, streamId: string, question: string, options: string[]) {
  const open = await prisma.poll.findMany({ where: { streamId, status: 'open' }, select: { id: true } });
  await prisma.poll.updateMany({ where: { streamId, status: 'open' }, data: { status: 'closed' } });
  for (const o of open) await broadcast(io, o.id);
  const created = await prisma.poll.create({ data: { streamId, question, optionsJson: JSON.stringify(options) } });
  return broadcast(io, created.id);
}

export async function closePoll(io: Server, pollId: string) {
  await prisma.poll.update({ where: { id: pollId }, data: { status: 'closed' } });
  return broadcast(io, pollId);
}

/** Creator-only poll start/close. Starting a poll closes any open one on the stream. */
export const pollRoutes = (io: Server) => async (app: FastifyInstance) => {
  app.post<{ Params: { id: string } }>('/api/streams/:id/polls', { preHandler: requireUser }, async (req, reply) => {
    const s = await prisma.stream.findUnique({ where: { id: req.params.id } });
    if (!s || s.channelId !== req.user.channelId || s.status !== 'live') return reply.code(404).send({ error: 'Stream not live' });
    const parsed = PollCreate.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: 'A question and 2–4 options are needed' });
    return { poll: await openPoll(io, s.id, parsed.data.question, parsed.data.options) };
  });

  app.post<{ Params: { id: string } }>('/api/polls/:id/close', { preHandler: requireUser }, async (req, reply) => {
    const p = await prisma.poll.findUnique({ where: { id: req.params.id }, include: { stream: true } });
    if (!p || p.stream.channelId !== req.user.channelId) return reply.code(404).send({ error: 'Poll not found' });
    return { poll: await closePoll(io, p.id) };
  });
};
