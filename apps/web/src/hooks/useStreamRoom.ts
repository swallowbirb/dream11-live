import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { EV, type ChatDeleted, type ChatMessage, type ModActionBody, type Score, type ScoreUpdate, type StreamStatus } from '@d11/shared';
import { getSocket } from '@/lib/socket';

/** Joins a stream's socket room: chat history + live messages, viewer count, live score, send. */
export function useStreamRoom(streamId: string | undefined) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [viewerCount, setViewerCount] = useState(0);
  const [score, setScore] = useState<Score | null>(null);

  useEffect(() => {
    if (!streamId) return;
    const s = getSocket();
    const onHistory = (p: { streamId: string; messages: ChatMessage[] }) =>
      p.streamId === streamId && setMessages(p.messages);
    const onMessage = (p: { streamId: string; message: ChatMessage }) =>
      p.streamId === streamId && setMessages((m) => [...m.slice(-199), p.message]);
    const onDeleted = (p: ChatDeleted) =>
      p.streamId === streamId && setMessages((m) => m.filter((x) => !p.messageIds.includes(x.id)));
    const onStatus = (p: StreamStatus) => p.streamId === streamId && setViewerCount(p.viewerCount);
    // score:update only reaches rooms of streams on that match, so no matchId filter is needed.
    const onScore = (p: ScoreUpdate) => setScore(p.score);
    const onRejected = (p: { reason: string }) => toast.error(p.reason);
    const join = () => s.emit(EV.roomJoin, streamId);

    s.on(EV.chatHistory, onHistory);
    s.on(EV.chatMessage, onMessage);
    s.on(EV.chatDeleted, onDeleted);
    s.on(EV.streamStatus, onStatus);
    s.on(EV.chatRejected, onRejected);
    s.on(EV.scoreUpdate, onScore);
    s.on('connect', join); // also re-joins after a reconnect
    if (s.connected) join();
    return () => {
      s.emit(EV.roomLeave, streamId);
      s.off(EV.chatHistory, onHistory);
      s.off(EV.chatMessage, onMessage);
      s.off(EV.chatDeleted, onDeleted);
      s.off(EV.streamStatus, onStatus);
      s.off(EV.chatRejected, onRejected);
      s.off(EV.scoreUpdate, onScore);
      s.off('connect', join);
    };
  }, [streamId]);

  const send = useCallback(
    (body: string, teamBadge?: string) => streamId && getSocket().emit(EV.chatSend, { streamId, body, teamBadge }),
    [streamId],
  );

  /** Creator only (the server ignores anyone else). */
  const moderate = useCallback(
    (a: { action: 'delete'; messageId: string } | { action: 'ban'; userId: string }) =>
      streamId && getSocket().emit(EV.modAction, { streamId, ...a } satisfies ModActionBody),
    [streamId],
  );

  return { messages, viewerCount, score, send, moderate };
}
