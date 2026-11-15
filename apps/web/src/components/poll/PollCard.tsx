import { motion } from 'motion/react';
import { BarChart3, Check, X } from 'lucide-react';
import type { PollState } from '@d11/shared';
import { cn } from '@/lib/utils';

const pct = (p: PollState, i: number) => (p.total ? Math.round((p.counts[i] / p.total) * 100) : 0);

/** Result bars (shown after voting, once closed, and on the dashboard). */
export function PollResults({ poll, myVote }: { poll: PollState; myVote?: number }) {
  const max = Math.max(...poll.counts);
  return (
    <div className="space-y-1.5">
      {poll.options.map((o, i) => (
        <div key={i} className="relative overflow-hidden rounded-lg bg-muted px-3 py-1.5 text-sm" data-testid="poll-result">
          <motion.div
            className={cn('absolute inset-y-0 left-0', poll.status === 'closed' && poll.counts[i] === max && max > 0 ? 'bg-success/30' : 'bg-brand/15')}
            animate={{ width: `${pct(poll, i)}%` }}
            transition={{ type: 'spring', stiffness: 140, damping: 22 }}
          />
          <div className="relative flex items-center justify-between gap-2">
            <span className="flex items-center gap-1 font-medium">
              {myVote === i && <Check className="size-3.5 text-success" />}
              {o}
            </span>
            <span className="font-bold tabular">{pct(poll, i)}%</span>
          </div>
        </div>
      ))}
      <p className="text-xs text-muted-foreground tabular">
        {poll.total} {poll.total === 1 ? 'vote' : 'votes'}
        {poll.status === 'closed' && ' · Final result'}
      </p>
    </div>
  );
}

/** Viewer poll card: vote buttons, then live results. */
export function PollCard({
  poll,
  myVote,
  onVote,
  onDismiss,
  className,
}: {
  poll: PollState;
  myVote?: number;
  onVote: (i: number) => void;
  onDismiss?: () => void;
  className?: string;
}) {
  const showResults = myVote !== undefined || poll.status === 'closed';
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn('space-y-2 rounded-2xl bg-surface/95 p-3 text-foreground shadow-lg backdrop-blur', className)}
      data-testid="poll-card"
      data-status={poll.status}
    >
      <div className="flex items-start gap-2">
        <BarChart3 className="mt-0.5 size-4 shrink-0 text-brand" />
        <p className="flex-1 text-sm font-bold leading-snug">{poll.question}</p>
        {poll.status === 'closed' && onDismiss && (
          <button type="button" aria-label="Dismiss poll" onClick={onDismiss} className="text-muted-foreground hover:text-foreground">
            <X className="size-4" />
          </button>
        )}
      </div>
      {showResults ? (
        <PollResults poll={poll} myVote={myVote} />
      ) : (
        <div className="grid gap-1.5">
          {poll.options.map((o, i) => (
            <button
              key={i}
              type="button"
              onClick={() => onVote(i)}
              data-testid="poll-option"
              className="rounded-lg border-2 border-brand/30 px-3 py-1.5 text-left text-sm font-semibold transition hover:border-brand hover:bg-brand/5 active:scale-[0.98]"
            >
              {o}
            </button>
          ))}
        </div>
      )}
    </motion.div>
  );
}
