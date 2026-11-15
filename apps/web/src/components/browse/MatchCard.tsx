import { Link } from 'react-router';
import { Radio } from 'lucide-react';
import { flag, type MatchListItem } from '@d11/shared';
import { MatchStatus, scoreLine } from './MatchStatus';

function Team({ code }: { code: string }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <span className="grid size-12 place-items-center rounded-full bg-muted text-2xl">{flag(code)}</span>
      <span className="font-display text-lg font-bold">{code}</span>
    </div>
  );
}

export function MatchCard({ match }: { match: MatchListItem }) {
  const score = scoreLine(match);
  return (
    <Link
      to={`/matches/${match.id}`}
      data-testid="match-card"
      className="block rounded-2xl bg-surface p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md active:scale-[0.99]"
    >
      <div className="flex items-center justify-between gap-2">
        <span className="truncate text-xs font-medium text-muted-foreground">{match.tournament}</span>
        <MatchStatus match={match} />
      </div>
      <div className="my-3 flex items-center justify-around">
        <Team code={match.teamA} />
        <span className="font-display text-sm font-bold text-muted-foreground">vs</span>
        <Team code={match.teamB} />
      </div>
      <div className="flex items-center justify-between border-t pt-3 text-sm">
        <span className="font-display font-bold tabular">{score ?? <span className="text-muted-foreground">—</span>}</span>
        <span className={`inline-flex items-center gap-1 ${match.liveCount ? 'font-semibold text-brand' : 'text-muted-foreground'}`}>
          <Radio className="size-4" />
          {match.liveCount} {match.liveCount === 1 ? 'creator' : 'creators'} live
        </span>
      </div>
    </Link>
  );
}
