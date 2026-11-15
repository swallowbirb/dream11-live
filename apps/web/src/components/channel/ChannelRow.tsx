import { Link } from 'react-router';
import { flag, type ChannelInfo } from '@d11/shared';
import { UserAvatar } from '@/components/Header';
import { LivePill } from '@/components/LivePill';
import { FollowButton } from './FollowButton';

/** A followed channel on /following: live ones link straight to the stream. */
export function ChannelRow({ channel }: { channel: ChannelInfo }) {
  const live = channel.live;
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-surface p-3 shadow-sm" data-testid="channel-row">
      <Link to={live ? `/watch/${live.id}` : `/c/${channel.id}`} className="relative shrink-0">
        <UserAvatar name={channel.displayName} className={live ? 'size-12 ring-2 ring-brand ring-offset-2' : 'size-12 opacity-80'} />
      </Link>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <Link to={`/c/${channel.id}`} className="truncate font-semibold hover:text-brand">
            {channel.displayName}
          </Link>
          {live && <LivePill />}
        </div>
        <p className="truncate text-sm text-muted-foreground">
          {live ? (
            <Link to={`/watch/${live.id}`} className="hover:text-brand">
              {live.title}
              {live.match && ` · ${flag(live.match.teamA)} ${live.match.teamA} vs ${live.match.teamB} ${flag(live.match.teamB)}`}
            </Link>
          ) : (
            `Offline · ${channel.followerCount} ${channel.followerCount === 1 ? 'follower' : 'followers'}`
          )}
        </p>
      </div>
      <FollowButton channel={channel} className="shrink-0" />
    </div>
  );
}
