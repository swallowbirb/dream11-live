import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { Tv } from 'lucide-react';
import type { LiveStream, MatchListItem } from '@d11/shared';
import { MatchCard } from '@/components/browse/MatchCard';
import { StreamCard, StreamGridSkeleton } from '@/components/browse/StreamCard';
import { api } from '@/lib/api';

/** Scores and creator counts refresh by polling (no match socket room in the prototype). */
export const BROWSE_REFRESH_MS = 5000;

export function useMatches() {
  return useQuery({
    queryKey: ['matches'],
    queryFn: () => api<{ matches: MatchListItem[] }>('/matches'),
    refetchInterval: BROWSE_REFRESH_MS,
  });
}

export function Section({ title, children, testId }: { title: ReactNode; children: ReactNode; testId?: string }) {
  return (
    <section className="space-y-3" data-testid={testId}>
      <h2 className="font-display text-2xl font-bold">{title}</h2>
      {children}
    </section>
  );
}

export function EmptyState({ title, note, action }: { title: string; note: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed bg-surface p-8 text-center">
      <Tv className="size-8 text-brand" />
      <p className="font-semibold">{title}</p>
      <p className="text-sm text-muted-foreground">{note}</p>
      {action}
    </div>
  );
}

export function MatchGridSkeleton({ n = 3 }: { n?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: n }, (_, i) => (
        <div key={i} className="space-y-3 rounded-2xl bg-surface p-4 shadow-sm">
          <div className="flex justify-between">
            <div className="h-3 w-32 animate-pulse rounded bg-muted" />
            <div className="h-4 w-12 animate-pulse rounded-full bg-muted" />
          </div>
          <div className="flex items-center justify-around py-1">
            <div className="size-12 animate-pulse rounded-full bg-muted" />
            <div className="size-12 animate-pulse rounded-full bg-muted" />
          </div>
          <div className="h-4 animate-pulse rounded bg-muted" />
        </div>
      ))}
    </div>
  );
}

const MatchGrid = ({ matches }: { matches: MatchListItem[] }) => (
  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
    {matches.map((m) => (
      <MatchCard key={m.id} match={m} />
    ))}
  </div>
);

export function HomePage() {
  const matches = useMatches();
  const streams = useQuery({
    queryKey: ['streams-live'],
    queryFn: () => api<{ streams: LiveStream[] }>('/streams/live'),
    refetchInterval: BROWSE_REFRESH_MS,
  });
  const all = matches.data?.matches ?? [];
  const live = all.filter((m) => m.status === 'live');
  const upcoming = all.filter((m) => m.status === 'upcoming');

  return (
    <div className="space-y-8">
      <Section title="Live matches" testId="live-matches">
        {matches.isPending ? (
          <MatchGridSkeleton n={1} />
        ) : live.length ? (
          <MatchGrid matches={live} />
        ) : (
          <EmptyState title="No matches live right now" note="Check the upcoming fixtures below." />
        )}
      </Section>

      <Section title="Live streams" testId="live-streams">
        {streams.isPending ? (
          <StreamGridSkeleton />
        ) : streams.data?.streams.length ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {streams.data.streams.map((s) => (
              <StreamCard key={s.id} stream={s} />
            ))}
          </div>
        ) : (
          <EmptyState
            title="No one is live yet"
            note="Be the first creator to go live on a match."
            action={
              <Link to="/dashboard" className="text-sm font-semibold text-brand hover:underline">
                Go live
              </Link>
            }
          />
        )}
      </Section>

      {upcoming.length > 0 && (
        <Section title="Upcoming" testId="upcoming-matches">
          <MatchGrid matches={upcoming} />
        </Section>
      )}
    </div>
  );
}

/** /matches: every match, grouped by status (tabs and filters are cut for the prototype). */
export function MatchesPage() {
  const { data, isPending } = useMatches();
  if (isPending)
    return (
      <Section title="Matches">
        <MatchGridSkeleton />
      </Section>
    );
  const all = data?.matches ?? [];
  if (!all.length) return <EmptyState title="No matches yet" note="Fixtures show up here as soon as they're scheduled." />;
  const groups = [
    ['Live', all.filter((m) => m.status === 'live')],
    ['Upcoming', all.filter((m) => m.status === 'upcoming')],
    ['Completed', all.filter((m) => m.status === 'completed')],
  ] as const;
  return (
    <div className="space-y-8">
      {groups.map(([title, ms]) => ms.length > 0 && <Section key={title} title={title}><MatchGrid matches={[...ms]} /></Section>)}
    </div>
  );
}
