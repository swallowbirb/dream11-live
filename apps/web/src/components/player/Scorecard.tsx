import { flag, type Score } from '@d11/shared';
import { cn } from '@/lib/utils';

const ballStyle = (b: string) =>
  b === 'W'
    ? 'bg-brand text-white'
    : b === '4' || b === '6'
      ? 'bg-success text-white'
      : b === 'wd' || b === 'nb'
        ? 'bg-warning/20 text-[#9a6a00]'
        : 'bg-muted text-foreground';

/** Live scorecard strip under the player: score, overs, batters, bowler, last 6 balls. */
export function Scorecard({ score }: { score: Score }) {
  return (
    <div data-testid="scorecard" className="flex flex-wrap items-center gap-x-5 gap-y-2 rounded-2xl bg-ink px-4 py-3 text-white">
      <div className="flex items-baseline gap-2">
        <span className="text-lg">{flag(score.batting)}</span>
        <span className="font-display text-sm font-bold text-white/70">{score.batting}</span>
        <span key={`${score.runs}/${score.wickets}`} data-testid="score-runs" className="font-display text-2xl font-bold tabular animate-in fade-in slide-in-from-bottom-1">
          {score.runs}/{score.wickets}
        </span>
        <span className="text-sm text-white/70 tabular">({score.overs})</span>
      </div>
      <div className="space-y-0.5 text-sm">
        {score.batters.map((b) => (
          <div key={b.name} className={cn('tabular', !b.onStrike && 'text-white/60')}>
            {b.name}
            {b.onStrike && <span className="text-brand">*</span>} <span className="font-semibold">{b.runs}</span>
            <span className="text-white/60"> ({b.balls})</span>
          </div>
        ))}
      </div>
      {score.bowler && (
        <div className="text-sm tabular">
          <span className="text-white/60">🏏 </span>
          {score.bowler.name}{' '}
          <span className="font-semibold">
            {score.bowler.wickets}-{score.bowler.runs}
          </span>
          <span className="text-white/60"> ({score.bowler.overs})</span>
        </div>
      )}
      <div className="ml-auto flex gap-1">
        {score.recent.map((b, i) => (
          <span key={i} className={cn('grid size-7 place-items-center rounded-full text-xs font-bold', ballStyle(b))}>
            {b === '.' ? '•' : b}
          </span>
        ))}
      </div>
      {score.finished && <span className="w-full text-xs font-semibold text-warning">Innings complete</span>}
    </div>
  );
}
