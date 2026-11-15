import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { EV, type ChatMessage, type StreamStatus } from '@d11/shared';
import { getSocket } from '@/lib/socket';

/** Joins a stream's socket room: chat history + live messages, viewer count, send. */
export function useStreamRoom(streamId: string | undefined) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [viewerCount, setViewerCount] = useState(0);

  useEffect(() => {
    if (!streamId) return;
    const s = getSocket();
    const onHistory = (p: { streamId: string; messages: ChatMessage[] }) =>
      p.streamId === streamId && setMessages(p.messages);
    const onMessage = (p: { streamId: string; message: ChatMessage }) =>
      p.streamId === streamId && setMessages((m) => [...m.slice(-199), p.message]);
    const onStatus = (p: StreamStatus) => p.streamId === streamId && setViewerCount(p.viewerCount);
    const onRejected = (p: { reason: string }) => toast.error(p.reason);
    const join = () => s.emit(EV.roomJoin, streamId);

    s.on(EV.chatHistory, onHistory);
    s.on(EV.chatMessage, onMessage);
    s.on(EV.streamStatus, onStatus);
    s.on(EV.chatRejected, onRejected);
    s.on('connect', join); // also re-joins after a reconnect
    if (s.connected) join();
    return () => {
      s.emit(EV.roomLeave, streamId);
      s.off(EV.chatHistory, onHistory);
      s.off(EV.chatMessage, onMessage);
      s.off(EV.streamStatus, onStatus);
      s.off(EV.chatRejected, onRejected);
      s.off('connect', join);
    };
  }, [streamId]);

  const send = useCallback(
    (body: string, teamBadge?: string) => streamId && getSocket().emit(EV.chatSend, { streamId, body, teamBadge }),
    [streamId],
  );

  return { messages, viewerCount, send };
}
