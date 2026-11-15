import { Link, useParams } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { flag, type LiveStream, type MatchListItem } from '@d11/shared';
import { MatchStatus } from '@/components/browse/MatchStatus';
import { StreamCard, StreamGridSkeleton } from '@/components/browse/StreamCard';
import { BROWSE_REFRESH_MS, EmptyState, Section } from '@/pages/Home';
import { api } from '@/lib/api';

export function MatchPage() {
  const { id } = useParams();
  const { data, isPending, isError } = useQuery({
    queryKey: ['match', id],
    queryFn: () => api<{ match: MatchListItem; streams: LiveStream[] }>(`/matches/${id}`),
    refetchInterval: BROWSE_REFRESH_MS,
  });
  if (isError) return <p className="text-muted-foreground">Match not found.</p>;
  const m = data?.match;
  const s = m?.score;

  return (
    <div className="space-y-8">
      {isPending || !m ? (
        <div className="h-40 animate-pulse rounded-2xl bg-muted" />
      ) : (
        <header className="overflow-hidden rounded-2xl bg-gradient-to-br from-brand to-brand-dark p-5 text-white shadow-sm" data-testid="match-header">
          <div className="flex items-center justify-between gap-2 text-sm text-white/80">
            <span>{m.tournament}</span>
            <MatchStatus match={m} className={m.status === 'live' ? 'bg-white text-brand' : undefined} />
          </div>
          <div className="mt-4 flex items-center justify-center gap-6 font-display">
            <span className="text-3xl font-bold">
              {flag(m.teamA)} {m.teamA}
            </span>
            <span className="text-white/60">vs</span>
            <span className="text-3xl font-bold">
              {m.teamB} {flag(m.teamB)}
            </span>
          </div>
          {s && (
            <div className="mt-3 text-center">
              <span key={s.runs + '/' + s.wickets} className="inline-block font-display text-4xl font-bold tabular animate-in fade-in slide-in-from-bottom-1" data-testid="match-score">
                {s.batting} {s.runs}/{s.wickets}
              </span>
              <span className="ml-2 text-white/80 tabular">({s.overs} ov)</span>
              <p className="mt-1 text-sm text-white/80">
                {s.batters.map((b) => `${b.name}${b.onStrike ? '*' : ''} ${b.runs} (${b.balls})`).join(' · ')}
              </p>
            </div>
          )}
        </header>
      )}

      <Section title={<>Creators streaming{m ? ` · ${m.liveCount}` : ''}</>} testId="match-streams">
        {isPending ? (
          <StreamGridSkeleton />
        ) : data?.streams.length ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data.streams.map((st) => (
              <StreamCard key={st.id} stream={st} />
            ))}
          </div>
        ) : (
          <EmptyState
            title="No one is live for this match yet"
            note="Be the first — go live and bring the hype."
            action={
              <Link to="/dashboard" className="text-sm font-semibold text-brand hover:underline">
                Go live on this match
              </Link>
            }
          />
        )}
      </Section>
    </div>
  );
}
