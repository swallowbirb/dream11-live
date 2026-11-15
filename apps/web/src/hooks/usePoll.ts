import { useCallback, useEffect, useState } from 'react';
import { EV, type PollState, type PollUpdate } from '@d11/shared';
import { getSocket } from '@/lib/socket';

/** The stream's current poll (room joined by useStreamRoom) and this user's vote. */
export function usePoll(streamId: string | undefined) {
  const [poll, setPoll] = useState<PollState | null>(null);
  const [myVotes, setMyVotes] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!streamId) return;
    const s = getSocket();
    const onUpdate = (u: PollUpdate) => {
      if (u.streamId !== streamId) return;
      // A close of an older poll (when a new one starts) arrives before the new poll: keep the newest.
      setPoll((cur) => (cur && cur.id !== u.poll.id && u.poll.status === 'closed' && cur.status === 'open' ? cur : u.poll));
      if (u.myVote != null) setMyVotes((v) => ({ ...v, [u.poll.id]: u.myVote! }));
    };
    s.on(EV.pollUpdate, onUpdate);
    return () => {
      s.off(EV.pollUpdate, onUpdate);
      setPoll(null);
    };
  }, [streamId]);

  const vote = useCallback(
    (optionIndex: number) => {
      if (!poll) return;
      setMyVotes((v) => ({ ...v, [poll.id]: optionIndex }));
      getSocket().emit(EV.pollVote, { pollId: poll.id, optionIndex });
    },
    [poll],
  );

  return { poll, setPoll, myVote: poll ? myVotes[poll.id] : undefined, vote };
}
