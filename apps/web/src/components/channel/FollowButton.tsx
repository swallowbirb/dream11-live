import { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Heart } from 'lucide-react';
import { toast } from 'sonner';
import type { ChannelInfo } from '@d11/shared';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { useSession } from '@/lib/session';
import { cn } from '@/lib/utils';

/** Follow / Following toggle (optimistic). Hidden on your own channel. */
export function FollowButton({ channel, className }: { channel: ChannelInfo; className?: string }) {
  const me = useSession((s) => s.user);
  const qc = useQueryClient();
  const [following, setFollowing] = useState(channel.following);
  useEffect(() => setFollowing(channel.following), [channel.following]);

  const m = useMutation({
    mutationFn: (follow: boolean) => api(`/channels/${channel.id}/follow`, { method: follow ? 'POST' : 'DELETE' }),
    onMutate: (follow) => setFollowing(follow),
    onSuccess: (_, follow) => {
      if (follow) toast.success(`Following ${channel.displayName}. We'll tell you when they go live.`);
    },
    onError: (e, follow) => {
      setFollowing(!follow);
      toast.error(e.message);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['channel', channel.id] });
      qc.invalidateQueries({ queryKey: ['following'] });
    },
  });

  if (me?.id === channel.userId) return null;
  return (
    <Button
      size="sm"
      variant={following ? 'secondary' : 'default'}
      onClick={() => m.mutate(!following)}
      className={cn('font-semibold', className)}
      data-testid="follow-button"
      aria-pressed={following}
    >
      <Heart className={cn(following && 'fill-brand text-brand')} />
      {following ? 'Following' : 'Follow'}
    </Button>
  );
}
