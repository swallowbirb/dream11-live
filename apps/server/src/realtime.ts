import type { Server, Socket } from 'socket.io';
import { ChatSend, EV, ModActionBody, ReactionBatch, type ChatDeleted, type ChatMessage, type Notify, type ReactionBurst, type ReactionCounts, type StreamStatus } from '@d11/shared';
import type { ChatMessage as ChatRow, User } from '@prisma/client';
import { prisma } from './db';
import { userForToken } from './auth';

type SocketUser = NonNullable<Awaited<ReturnType<typeof userForToken>>>;
import { roomOf } from './rooms';
import { pollJoin, pollSockets } from './polls';
import { botViewers } from './bots/viewers';
export { roomOf };

// streamId → the streamer's user id and channel (creator badge, viewer count, sub badges). Streams never change owner.
type Owner = { userId: string; channelId: string } | null;
const ownerCache = new Map<string, Owner>();
async function streamRefs(streamId: string): Promise<Owner> {
  if (!ownerCache.has(streamId)) {
    const s = await prisma.stream.findUnique({ where: { id: streamId }, select: { channelId: true, channel: { select: { userId: true } } } });
    ownerCache.set(streamId, s ? { userId: s.channel.userId, channelId: s.channelId } : null);
  }
  return ownerCache.get(streamId)!;
}
async function streamOwner(streamId: string) {
  return (await streamRefs(streamId))?.userId ?? null;
}

const toMessage = (m: ChatRow & { user: Pick<User, 'id' | 'name'> }, ownerId: string | null, subs: Set<string>): ChatMessage => ({
  id: m.id,
  user: { id: m.user.id, name: m.user.name, isCreator: m.user.id === ownerId, isSub: subs.has(m.user.id) },
  body: m.body,
  teamBadge: m.teamBadge,
  createdAt: m.createdAt.toISOString(),
});

let ioRef: Server | null = null;

// Reactions: taps per stream since the last flush, plus a rolling window of per-tick totals for the hype meter.
const FLUSH_MS = 250;
const HYPE_WINDOW = 20; // ticks = 5 s
const HYPE_PER_TAP = 4; // 25 taps in 5 s fills the meter
type Hype = { pending: ReactionCounts; window: number[] };
const hype = new Map<string, Hype>();

function flushReactions(io: Server) {
  for (const [streamId, h] of hype) {
    const counts = h.pending;
    h.pending = {};
    const total = Object.values(counts).reduce((a, n) => a + (n ?? 0), 0);
    h.window = [...h.window, total].slice(-HYPE_WINDOW);
    const sum = h.window.reduce((a, n) => a + n, 0);
    const burst: ReactionBurst = { streamId, counts, hype: Math.min(100, sum * HYPE_PER_TAP) };
    io.to(roomOf(streamId)).emit(EV.reactionBurst, burst);
    if (sum === 0) hype.delete(streamId); // that 0 burst let clients settle the meter
  }
}

/** Sockets in a stream's room minus the streamer's, plus a bot stream's simulated audience. Same as stream:status. */
export function viewerCount(streamId: string, ownerUserId: string) {
  const ids = ioRef?.sockets.adapter.rooms.get(roomOf(streamId));
  let n = botViewers.get(streamId) ?? 0;
  for (const id of ids ?? []) if ((ioRef!.sockets.sockets.get(id)?.data.user as SocketUser | undefined)?.id !== ownerUserId) n++;
  return n;
}

/** Whether anyone has the stream open (bots only chat to rooms with an audience). */
export const isWatched = (streamId: string) => (ioRef?.sockets.adapter.rooms.get(roomOf(streamId))?.size ?? 0) > 0;

export async function broadcastCount(streamId: string) {
  const owner = await streamOwner(streamId);
  if (!ioRef || !owner) return;
  const status: StreamStatus = { streamId, viewerCount: viewerCount(streamId, owner) };
  ioRef.to(roomOf(streamId)).emit(EV.streamStatus, status);
}

/** Saves a chat message and sends it to the room. The ban check is the caller's. */
export async function postChat(streamId: string, userId: string, body: string, teamBadge?: string | null) {
  const row = await prisma.chatMessage.create({
    data: { streamId, userId, body, teamBadge: teamBadge || null },
    include: { user: { select: { id: true, name: true } } },
  });
  const subs = await subscriberIds(streamId, [userId]);
  ioRef?.to(roomOf(streamId)).emit(EV.chatMessage, { streamId, message: toMessage(row, await streamOwner(streamId), subs) });
}

/** Adds taps to the stream's next reaction:burst (and the hype meter). */
export function addReactions(streamId: string, counts: ReactionCounts) {
  const h = hype.get(streamId) ?? { pending: {}, window: [] };
  hype.set(streamId, h);
  for (const [emoji, n] of Object.entries(counts) as [keyof ReactionCounts, number][])
    h.pending[emoji] = (h.pending[emoji] ?? 0) + n;
}

/** `notify` to every follower of a channel who has a socket open (each socket is in its `user:<id>` room). */
export async function notifyFollowers(channelId: string, payload: Notify) {
  if (!ioRef) return;
  const follows = await prisma.follow.findMany({ where: { channelId }, select: { followerId: true } });
  if (follows.length) ioRef.to(follows.map((f) => `user:${f.followerId}`)).emit(EV.notify, payload);
}

async function isBanned(streamId: string, userId: string) {
  const ref = await streamRefs(streamId);
  if (!ref) return false;
  const ban = await prisma.ban.findUnique({ where: { channelId_userId: { channelId: ref.channelId, userId } } });
  return !!ban && (!ban.expiresAt || ban.expiresAt > new Date());
}

/** Which of these users have an active subscription to the stream's channel (for the SUB badge). */
async function subscriberIds(streamId: string, userIds: string[]) {
  const ref = await streamRefs(streamId);
  if (!ref || !userIds.length) return new Set<string>();
  const rows = await prisma.subscription.findMany({
    where: { channelId: ref.channelId, status: 'active', userId: { in: [...new Set(userIds)] } },
    select: { userId: true },
  });
  return new Set(rows.map((r) => r.userId));
}

export function setupRealtime(io: Server) {
  ioRef = io;
  setInterval(() => flushReactions(io), FLUSH_MS);

  // Session token from handshake.auth, same as the REST Bearer token.
  io.use(async (socket, next) => {
    const user = await userForToken(socket.handshake.auth?.token);
    if (!user) return next(new Error('Not logged in'));
    socket.data.user = user;
    next();
  });

  io.on('connection', (socket: Socket) => {
    const user = socket.data.user as SocketUser;
    socket.join(`user:${user.id}`);

    socket.on(EV.roomJoin, async (streamId: string) => {
      if (typeof streamId !== 'string') return;
      await socket.join(roomOf(streamId));
      const [rows, owner] = await Promise.all([
        prisma.chatMessage.findMany({
          where: { streamId, deletedBy: null },
          orderBy: { createdAt: 'desc' },
          take: 50,
          include: { user: { select: { id: true, name: true } } },
        }),
        streamOwner(streamId),
      ]);
      const subs = await subscriberIds(streamId, rows.map((r) => r.userId));
      socket.emit(EV.chatHistory, { streamId, messages: rows.reverse().map((m) => toMessage(m, owner, subs)) });
      await pollJoin(socket, streamId, user.id);
      await broadcastCount(streamId);
    });

    socket.on(EV.roomLeave, async (streamId: string) => {
      await socket.leave(roomOf(streamId));
      await broadcastCount(streamId);
    });

    socket.on(EV.chatSend, async (payload: unknown) => {
      const parsed = ChatSend.safeParse(payload);
      if (!parsed.success) return socket.emit(EV.chatRejected, { reason: 'Message must be 1–300 characters' });
      const { streamId, body, teamBadge } = parsed.data;
      if (!socket.rooms.has(roomOf(streamId))) return;
      if (await isBanned(streamId, user.id)) return socket.emit(EV.chatRejected, { reason: 'You are banned from this chat' });
      await postChat(streamId, user.id, body, teamBadge);
    });

    pollSockets(io, socket, user.id);

    // Moderation: the stream's creator deletes a message or bans its author (permanent, whole channel).
    socket.on(EV.modAction, async (payload: unknown) => {
      const parsed = ModActionBody.safeParse(payload);
      if (!parsed.success) return;
      const a = parsed.data;
      const ref = await streamRefs(a.streamId);
      if (!ref || ref.userId !== user.id) return;
      let messageIds: string[];
      if (a.action === 'delete') {
        const res = await prisma.chatMessage.updateMany({ where: { id: a.messageId, streamId: a.streamId }, data: { deletedBy: user.id } });
        messageIds = res.count ? [a.messageId] : [];
      } else {
        if (a.userId === user.id) return;
        const key = { channelId: ref.channelId, userId: a.userId };
        await prisma.ban.upsert({ where: { channelId_userId: key }, create: { ...key, byUserId: user.id }, update: { expiresAt: null } });
        const rows = await prisma.chatMessage.findMany({ where: { streamId: a.streamId, userId: a.userId, deletedBy: null }, select: { id: true } });
        messageIds = rows.map((r) => r.id);
        await prisma.chatMessage.updateMany({ where: { id: { in: messageIds } }, data: { deletedBy: user.id } });
      }
      await prisma.modAction.create({
        data: {
          channelId: ref.channelId,
          actorId: user.id,
          targetUserId: a.action === 'ban' ? a.userId : null,
          action: a.action,
          details: a.action === 'delete' ? a.messageId : null,
        },
      });
      if (messageIds.length) io.to(roomOf(a.streamId)).emit(EV.chatDeleted, { streamId: a.streamId, messageIds } satisfies ChatDeleted);
    });

    socket.on(EV.reactionBatch, (payload: unknown) => {
      const parsed = ReactionBatch.safeParse(payload);
      if (!parsed.success || !socket.rooms.has(roomOf(parsed.data.streamId))) return;
      addReactions(parsed.data.streamId, parsed.data.counts);
    });

    socket.on('disconnecting', () => {
      const streams = [...socket.rooms].filter((r) => r.startsWith('stream:')).map((r) => r.slice(7));
      // Rooms are left after this handler returns; count on the next tick.
      setImmediate(() => streams.forEach((id) => broadcastCount(id)));
    });
  });
}
