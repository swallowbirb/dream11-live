import { useState } from 'react';
import { Link, useParams } from 'react-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { MonitorOff } from 'lucide-react';
import { flag, type StreamInfo, type StreamToken } from '@d11/shared';
import { UserAvatar } from '@/components/Header';
import { LivePill } from '@/components/LivePill';
import { LivePlayer } from '@/components/player/LivePlayer';
import { BotPlayer } from '@/components/player/BotPlayer';
import { Scorecard } from '@/components/player/Scorecard';
import { ViewerCount } from '@/components/ViewerCount';
import { ChatPanel } from '@/components/chat/ChatPanel';
import { useStreamRoom } from '@/hooks/useStreamRoom';
import { useReactions } from '@/hooks/useReactions';
import { usePoll } from '@/hooks/usePoll';
import { PollCard } from '@/components/poll/PollCard';
import { EmojiTray, HypeMeter, ReactionOverlay } from '@/components/player/Reactions';
import { api } from '@/lib/api';
import { FollowButton } from '@/components/channel/FollowButton';
import { SubscribeButton } from '@/components/channel/Subscribe';
import { useChannel } from '@/pages/Channel';

export function WatchPage() {
  const { streamId } = useParams();
  const qc = useQueryClient();
  const { data, isPending } = useQuery({
    queryKey: ['stream', streamId],
    queryFn: () => api<{ stream: StreamInfo }>(`/streams/${streamId}`),
  });
  const stream = data?.stream;
  const live = stream?.status === 'live';
  const room = useStreamRoom(stream?.id);
  const reactions = useReactions(live ? stream?.id : undefined);
  const polls = usePoll(live ? stream?.id : undefined);
  const [dismissed, setDismissed] = useState<string | null>(null);
  const poll = polls.poll && polls.poll.id !== dismissed ? polls.poll : null;
  const pollCard = (cls: string) =>
    poll && <PollCard poll={poll} myVote={polls.myVote} onVote={polls.vote} onDismiss={() => setDismissed(poll.id)} className={cls} />;
  const { data: tok } = useQuery({
    queryKey: ['stream-token', streamId],
    queryFn: () => api<StreamToken>(`/streams/${streamId}/token`),
    enabled: live && !stream?.bot,
    staleTime: Infinity,
  });

  const channel = useChannel(stream?.channel.id).data?.channel;
  const score = room.score ?? stream?.match?.score ?? null;

  const overlay = (
    <>
      <ReactionOverlay floaters={reactions.floaters} done={reactions.done} />
      {pollCard('pointer-events-auto absolute top-3 left-3 hidden w-72 sm:block')}
    </>
  );

  if (isPending) return <WatchSkeleton />;
  if (!stream)
    return (
      <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed bg-surface p-10 text-center">
        <MonitorOff className="size-8 text-brand" />
        <p className="font-semibold">This stream doesn't exist</p>
        <Link to="/" className="text-sm font-semibold text-brand hover:underline">
          Find someone live
        </Link>
      </div>
    );

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
      <div className="min-w-0 space-y-4">
        {live && stream.bot ? (
          <BotPlayer match={stream.bot.match} cam={stream.bot.cam} seed={stream.id} overlay={overlay} />
        ) : live && tok ? (
          <LivePlayer
            url={tok.url}
            token={tok.token}
            onPublisherLeft={() => qc.invalidateQueries({ queryKey: ['stream', streamId] })}
            overlay={overlay}
          />
        ) : live ? (
          <div className="aspect-video animate-pulse rounded-2xl bg-ink/80" />
        ) : (
          <div className="grid aspect-video place-items-center rounded-2xl bg-gradient-to-br from-ink to-[#3a3a3a] text-center text-white">
            <div className="space-y-2 px-6">
              <MonitorOff className="mx-auto size-10 opacity-70" />
              <p className="font-display text-2xl font-bold">{stream.channel.displayName} is offline</p>
              <p className="text-sm text-white/60">This stream has ended. Follow to catch the next one.</p>
            </div>
          </div>
        )}

        {live && (
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-2xl bg-surface px-3 py-2 shadow-sm">
            <EmojiTray onTap={reactions.tap} />
            <HypeMeter value={reactions.hype} />
          </div>
        )}

        {live && pollCard('sm:hidden')}

        {live && score && <Scorecard score={score} />}

        <div className="flex flex-wrap items-start gap-3 rounded-2xl bg-surface p-4 shadow-sm">
          <UserAvatar name={stream.channel.displayName} className="size-11" />
          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              {live && <LivePill />}
              {live && <ViewerCount count={room.viewerCount} />}
              <h1 className="truncate text-xl font-bold leading-tight" data-testid="stream-title">
                {stream.title}
              </h1>
            </div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
              <Link to={`/c/${stream.channel.id}`} className="font-semibold text-foreground hover:text-brand">
                {stream.channel.displayName}
              </Link>
              {stream.match && (
                <Link to={`/matches/${stream.match.id}`} className="hover:text-brand">
                  {flag(stream.match.teamA)} {stream.match.teamA} vs {stream.match.teamB} {flag(stream.match.teamB)}
                </Link>
              )}
              <span>{stream.language}</span>
              {stream.supportingTeam && (
                <span className="rounded-full bg-accent px-2 py-0.5 text-xs font-semibold text-accent-foreground">
                  Supporting {flag(stream.supportingTeam)} {stream.supportingTeam}
                </span>
              )}
            </div>
          </div>
          {channel && (
            <div className="flex w-full gap-2 sm:w-auto sm:shrink-0 [&>*]:flex-1 sm:[&>*]:flex-none">
              <FollowButton channel={channel} />
              <SubscribeButton channel={channel} />
            </div>
          )}
        </div>
      </div>
      <ChatPanel
        messages={room.messages}
        onSend={room.send}
        match={stream.match}
        closed={!live}
        className="h-[28rem] lg:sticky lg:top-20 lg:h-[calc(100dvh-6.5rem)]"
      />
    </div>
  );
}

function WatchSkeleton() {
  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
      <div className="space-y-4">
        <div className="aspect-video animate-pulse rounded-2xl bg-ink/80" />
        <div className="h-14 animate-pulse rounded-2xl bg-muted" />
        <div className="h-16 animate-pulse rounded-2xl bg-muted" />
        <div className="flex items-center gap-3 rounded-2xl bg-surface p-4 shadow-sm">
          <div className="size-11 animate-pulse rounded-full bg-muted" />
          <div className="flex-1 space-y-2">
            <div className="h-5 w-1/2 animate-pulse rounded bg-muted" />
            <div className="h-4 w-1/3 animate-pulse rounded bg-muted" />
          </div>
        </div>
      </div>
      <div className="h-[28rem] animate-pulse rounded-2xl bg-muted lg:h-[calc(100dvh-6.5rem)]" />
    </div>
  );
}
