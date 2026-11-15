import type { Server, Socket } from 'socket.io';
import { ChatSend, EV, type ChatMessage, type StreamStatus } from '@d11/shared';
import type { ChatMessage as ChatRow, User } from '@prisma/client';
import { prisma } from './db';
import { userForToken } from './auth';

type SocketUser = NonNullable<Awaited<ReturnType<typeof userForToken>>>;
export const roomOf = (streamId: string) => `stream:${streamId}`;

// streamId → the streamer's user id (for the creator badge and the viewer count). Streams never change owner.
const ownerCache = new Map<string, string | null>();
async function streamOwner(streamId: string) {
  if (!ownerCache.has(streamId)) {
    const s = await prisma.stream.findUnique({ where: { id: streamId }, select: { channel: { select: { userId: true } } } });
    ownerCache.set(streamId, s?.channel.userId ?? null);
  }
  return ownerCache.get(streamId)!;
}

const toMessage = (m: ChatRow & { user: Pick<User, 'id' | 'name'> }, ownerId: string | null): ChatMessage => ({
  id: m.id,
  user: { name: m.user.name, isCreator: m.user.id === ownerId },
  body: m.body,
  teamBadge: m.teamBadge,
  createdAt: m.createdAt.toISOString(),
});

export function setupRealtime(io: Server) {
  async function broadcastCount(streamId: string) {
    const owner = await streamOwner(streamId);
    const sockets = await io.in(roomOf(streamId)).fetchSockets();
    const status: StreamStatus = {
      streamId,
      viewerCount: sockets.filter((s) => (s.data.user as SocketUser).id !== owner).length,
    };
    io.to(roomOf(streamId)).emit(EV.streamStatus, status);
  }

  // Session token from handshake.auth, same as the REST Bearer token.
  io.use(async (socket, next) => {
    const user = await userForToken(socket.handshake.auth?.token);
    if (!user) return next(new Error('Not logged in'));
    socket.data.user = user;
    next();
  });

  io.on('connection', (socket: Socket) => {
    const user = socket.data.user as SocketUser;

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
      socket.emit(EV.chatHistory, { streamId, messages: rows.reverse().map((m) => toMessage(m, owner)) });
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
      const row = await prisma.chatMessage.create({
        data: { streamId, userId: user.id, body, teamBadge: teamBadge || null },
        include: { user: { select: { id: true, name: true } } },
      });
      io.to(roomOf(streamId)).emit(EV.chatMessage, { streamId, message: toMessage(row, await streamOwner(streamId)) });
    });

    socket.on('disconnecting', () => {
      const streams = [...socket.rooms].filter((r) => r.startsWith('stream:')).map((r) => r.slice(7));
      // Rooms are left after this handler returns; count on the next tick.
      setImmediate(() => streams.forEach((id) => broadcastCount(id)));
    });
  });
}
