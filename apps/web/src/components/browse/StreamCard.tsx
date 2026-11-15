import { Link } from 'react-router';
import { Eye } from 'lucide-react';
import { flag, type LiveStream } from '@d11/shared';
import { UserAvatar } from '@/components/Header';
import { LivePill } from '@/components/LivePill';

export function StreamCard({ stream }: { stream: LiveStream }) {
  const m = stream.match;
  return (
    <Link to={`/watch/${stream.id}`} data-testid="stream-card" className="group block space-y-2">
      <div className="relative aspect-video overflow-hidden rounded-2xl bg-gradient-to-br from-ink via-[#3a1214] to-brand-dark shadow-sm transition group-hover:-translate-y-0.5 group-hover:shadow-md">
        {m && (
          <div className="absolute inset-0 grid place-items-center font-display text-3xl font-bold text-white/90">
            <span>
              {flag(m.teamA)} <span className="text-base text-white/60">vs</span> {flag(m.teamB)}
            </span>
          </div>
        )}
        <LivePill className="absolute top-2 left-2" />
        <span className="absolute bottom-2 left-2 inline-flex items-center gap-1 rounded-md bg-black/60 px-1.5 py-0.5 text-xs font-semibold text-white tabular">
          <Eye className="size-3.5" /> {stream.viewerCount}
        </span>
      </div>
      <div className="flex gap-2.5">
        <UserAvatar name={stream.channel.displayName} className="size-9" />
        <div className="min-w-0">
          <p className="truncate font-semibold leading-tight group-hover:text-brand">{stream.title}</p>
          <p className="truncate text-sm text-muted-foreground">{stream.channel.displayName}</p>
          <div className="mt-1 flex flex-wrap gap-1 text-xs">
            <span className="rounded-full bg-muted px-2 py-0.5">{stream.language}</span>
            {stream.supportingTeam && (
              <span className="rounded-full bg-accent px-2 py-0.5 font-semibold text-accent-foreground">
                {flag(stream.supportingTeam)} {stream.supportingTeam}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

export function StreamGridSkeleton({ n = 3 }: { n?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: n }, (_, i) => (
        <div key={i} className="space-y-2">
          <div className="aspect-video animate-pulse rounded-2xl bg-muted" />
          <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
        </div>
      ))}
    </div>
  );
}
