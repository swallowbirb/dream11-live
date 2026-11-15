import { Link, useParams } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { MonitorOff } from 'lucide-react';
import { flag, type ChannelInfo } from '@d11/shared';
import { UserAvatar } from '@/components/Header';
import { LivePill } from '@/components/LivePill';
import { StreamCard } from '@/components/browse/StreamCard';
import { FollowButton } from '@/components/channel/FollowButton';
import { SubscribeButton } from '@/components/channel/Subscribe';
import { BROWSE_REFRESH_MS, Section } from '@/pages/Home';
import { api } from '@/lib/api';
import { useSession } from '@/lib/session';

export function useChannel(id: string | undefined) {
  return useQuery({
    queryKey: ['channel', id],
    queryFn: () => api<{ channel: ChannelInfo }>(`/channels/${id}`),
    enabled: !!id,
    refetchInterval: BROWSE_REFRESH_MS,
  });
}

export function ChannelPage() {
  const { channelId } = useParams();
  const { data, isPending, isError } = useChannel(channelId);
  const me = useSession((s) => s.user);
  if (isError) return <p className="text-muted-foreground">Channel not found.</p>;
  if (isPending || !data) return <ChannelSkeleton />;
  const c = data.channel;
  const mine = me?.id === c.userId;
  const action = mine ? (
    <Link to="/dashboard" className="inline-block text-sm font-semibold text-brand hover:underline">
      Go to dashboard
    </Link>
  ) : (
    <div className="flex gap-2 [&>*]:flex-1 sm:[&>*]:flex-none">
      <FollowButton channel={c} />
      <SubscribeButton channel={c} />
    </div>
  );

  return (
    <div className="space-y-8">
      <header className="overflow-hidden rounded-2xl bg-surface shadow-sm">
        <div className="h-28 bg-gradient-to-r from-brand via-brand-dark to-ink sm:h-36" />
        <div className="px-5 pb-5">
          <div className="grid grid-cols-[auto_minmax(0,1fr)] items-end gap-x-4 sm:grid-cols-[auto_minmax(0,1fr)_auto]">
            <UserAvatar name={c.displayName} className="-mt-10 size-20 shrink-0 text-2xl ring-4 ring-surface" />
            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="truncate text-3xl font-bold leading-tight">{c.displayName}</h1>
                {c.live && <LivePill />}
              </div>
              <p className="text-sm text-muted-foreground tabular" data-testid="follower-count">
                <span className="font-semibold text-foreground">{c.followerCount.toLocaleString()}</span>{' '}
                {c.followerCount === 1 ? 'follower' : 'followers'}
              </p>
            </div>
            <div className="col-span-2 mt-4 sm:col-span-1 sm:mt-0">{action}</div>
          </div>
        </div>
        {(c.bio || c.tags.length > 0 || c.favouriteTeam) && (
          <div className="space-y-2 border-t px-5 py-4">
            {c.bio && <p>{c.bio}</p>}
            <div className="flex flex-wrap gap-1.5 text-xs">
              {c.favouriteTeam && (
                <span className="rounded-full bg-accent px-2.5 py-1 font-semibold text-accent-foreground">
                  Supports {flag(c.favouriteTeam)} {c.favouriteTeam}
                </span>
              )}
              {c.tags.map((t) => (
                <span key={t} className="rounded-full bg-muted px-2.5 py-1 font-medium">
                  {t}
                </span>
              ))}
            </div>
          </div>
        )}
      </header>

      <Section title={c.live ? 'Live now' : 'Stream'}>
        {c.live ? (
          <div className="max-w-md">
            <StreamCard stream={c.live} />
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 rounded-2xl bg-gradient-to-br from-ink to-[#3a3a3a] p-10 text-center text-white">
            <MonitorOff className="size-9 opacity-70" />
            <p className="font-display text-xl font-bold">{c.displayName} is offline</p>
            <p className="text-sm text-white/60">
              {mine ? 'Go live from your dashboard.' : c.following ? "You'll get a notification when they go live." : 'Follow to get a notification when they go live.'}
            </p>
          </div>
        )}
      </Section>
    </div>
  );
}

function ChannelSkeleton() {
  return (
    <div className="space-y-8">
      <div className="overflow-hidden rounded-2xl bg-surface shadow-sm">
        <div className="h-28 animate-pulse bg-muted sm:h-36" />
        <div className="flex items-end gap-4 px-5 pb-5">
          <div className="-mt-10 size-20 animate-pulse rounded-full bg-muted ring-4 ring-surface" />
          <div className="flex-1 space-y-2">
            <div className="h-7 w-48 animate-pulse rounded bg-muted" />
            <div className="h-4 w-24 animate-pulse rounded bg-muted" />
          </div>
        </div>
      </div>
      <div className="aspect-video max-w-md animate-pulse rounded-2xl bg-muted" />
    </div>
  );
}
