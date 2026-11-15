import type { MatchSummary } from '@d11/shared';
import { cn } from '@/lib/utils';

function startsIn(iso: string) {
  const mins = Math.round((new Date(iso).getTime() - Date.now()) / 60_000);
  if (mins <= 0) return 'Starting soon';
  if (mins < 60) return `Starts in ${mins}m`;
  if (mins < 48 * 60) return `Starts in ${Math.round(mins / 60)}h`;
  return `Starts in ${Math.round(mins / 1440)}d`;
}

/** `● LIVE` red / `Starts in 2h` amber / `Completed` grey (DESIGN §4.2). */
export function MatchStatus({ match, className }: { match: MatchSummary; className?: string }) {
  const base = 'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold';
  if (match.status === 'live')
    return (
      <span className={cn(base, 'bg-brand text-white uppercase tracking-wider', className)}>
        <span className="size-1.5 animate-pulse rounded-full bg-current" /> Live
      </span>
    );
  if (match.status === 'upcoming')
    return <span className={cn(base, 'bg-warning/15 text-[#9a6a00]', className)}>{startsIn(match.startsAt)}</span>;
  return <span className={cn(base, 'bg-muted text-muted-foreground', className)}>Completed</span>;
}

/** "IND 63/3 (6.0)" or null before the first ball. */
export const scoreLine = (m: MatchSummary) =>
  m.score ? `${m.score.batting} ${m.score.runs}/${m.score.wickets} (${m.score.overs})` : null;
