import { useCallback, useEffect, useRef, useState } from 'react';
import { EV, type Reaction, type ReactionBurst, type ReactionCounts } from '@d11/shared';
import { getSocket } from '@/lib/socket';

export type Floater = { id: number; emoji: Reaction; x: number };

const BATCH_MS = 250;
const MAX_FLOATERS = 40;
let nextId = 0;

/**
 * Emoji reactions for a stream (the room is joined by useStreamRoom). Own taps float at once and are sent in
 * batches; the server's burst echoes them back, so those are subtracted before animating others' taps.
 */
export function useReactions(streamId: string | undefined) {
  const [floaters, setFloaters] = useState<Floater[]>([]);
  const [hype, setHype] = useState(0);
  const pending = useRef<ReactionCounts>({});
  const unechoed = useRef<ReactionCounts>({});

  const float = useCallback((emoji: Reaction, n: number) => {
    const add = Array.from({ length: Math.min(n, 8) }, () => ({ id: nextId++, emoji, x: 8 + Math.random() * 84 }));
    setFloaters((f) => [...f, ...add].slice(-MAX_FLOATERS));
  }, []);

  useEffect(() => {
    if (!streamId) return;
    const s = getSocket();
    const onBurst = (b: ReactionBurst) => {
      if (b.streamId !== streamId) return;
      setHype(b.hype);
      for (const [emoji, n] of Object.entries(b.counts) as [Reaction, number][]) {
        const mine = Math.min(n, unechoed.current[emoji] ?? 0);
        unechoed.current[emoji] = (unechoed.current[emoji] ?? 0) - mine;
        if (n - mine > 0) float(emoji, n - mine);
      }
    };
    const timer = setInterval(() => {
      const counts = pending.current;
      if (!Object.keys(counts).length) return;
      pending.current = {};
      for (const [e, n] of Object.entries(counts) as [Reaction, number][]) unechoed.current[e] = (unechoed.current[e] ?? 0) + n;
      s.emit(EV.reactionBatch, { streamId, counts });
    }, BATCH_MS);
    s.on(EV.reactionBurst, onBurst);
    return () => {
      clearInterval(timer);
      s.off(EV.reactionBurst, onBurst);
      pending.current = {};
      unechoed.current = {};
      setHype(0);
    };
  }, [streamId, float]);

  const tap = useCallback(
    (emoji: Reaction) => {
      pending.current[emoji] = Math.min(50, (pending.current[emoji] ?? 0) + 1);
      float(emoji, 1);
    },
    [float],
  );
  const done = useCallback((id: number) => setFloaters((f) => f.filter((x) => x.id !== id)), []);

  return { floaters, hype, tap, done };
}
