import { Link } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { Heart } from 'lucide-react';
import type { ChannelInfo } from '@d11/shared';
import { ChannelRow } from '@/components/channel/ChannelRow';
import { BROWSE_REFRESH_MS, Section } from '@/pages/Home';
import { api } from '@/lib/api';

export function useFollowing() {
  return useQuery({
    queryKey: ['following'],
    queryFn: () => api<{ channels: ChannelInfo[] }>('/me/following'),
    refetchInterval: BROWSE_REFRESH_MS,
  });
}

export function FollowingPage() {
  const { data, isPending } = useFollowing();
  const all = data?.channels ?? [];
  const live = all.filter((c) => c.live);
  const offline = all.filter((c) => !c.live);

  if (isPending)
    return (
      <div className="space-y-3">
        <div className="h-8 w-40 animate-pulse rounded bg-muted" />
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-[4.5rem] animate-pulse rounded-2xl bg-muted" />
        ))}
      </div>
    );

  if (!all.length)
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed bg-surface px-6 py-14 text-center">
        <span className="grid size-14 place-items-center rounded-full bg-accent">
          <Heart className="size-7 text-brand" />
        </span>
        <p className="font-display text-2xl font-bold">You're not following anyone yet</p>
        <p className="max-w-sm text-sm text-muted-foreground">
          Follow creators from their channel or stream, and they'll show up here, live ones first.
        </p>
        <Link to="/" className="text-sm font-semibold text-brand hover:underline">
          Find creators live now
        </Link>
      </div>
    );

  return (
    <div className="space-y-8">
      <Section title={`Live · ${live.length}`} testId="following-live">
        {live.length ? (
          <div className="grid gap-3 md:grid-cols-2">{live.map((c) => <ChannelRow key={c.id} channel={c} />)}</div>
        ) : (
          <p className="rounded-2xl bg-surface p-5 text-sm text-muted-foreground shadow-sm">
            None of your creators are live right now. You'll get a notification when one goes live.
          </p>
        )}
      </Section>
      {offline.length > 0 && (
        <Section title="Offline" testId="following-offline">
          <div className="grid gap-3 md:grid-cols-2">{offline.map((c) => <ChannelRow key={c.id} channel={c} />)}</div>
        </Section>
      )}
    </div>
  );
}
