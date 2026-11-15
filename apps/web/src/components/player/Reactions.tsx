import { AnimatePresence, motion } from 'motion/react';
import { Flame } from 'lucide-react';
import { REACTIONS, type Reaction } from '@d11/shared';
import type { Floater } from '@/hooks/useReactions';
import { cn } from '@/lib/utils';

/** Emojis floating up over the video; goes in LivePlayer's `overlay`. */
export function ReactionOverlay({ floaters, done }: { floaters: Floater[]; done: (id: number) => void }) {
  return (
    <AnimatePresence>
      {floaters.map((f) => (
        <motion.span
          key={f.id}
          data-testid="floater"
          className="absolute bottom-2 text-3xl drop-shadow-lg select-none"
          style={{ left: `${f.x}%` }}
          initial={{ y: 0, opacity: 0, scale: 0.6 }}
          animate={{ y: -260, opacity: [0, 1, 1, 0], scale: 1, x: [0, 14, -10, 6] }}
          transition={{ duration: 2.2, ease: 'easeOut' }}
          onAnimationComplete={() => done(f.id)}
        >
          {f.emoji}
        </motion.span>
      ))}
    </AnimatePresence>
  );
}

export function EmojiTray({ onTap }: { onTap: (e: Reaction) => void }) {
  return (
    <div className="flex gap-1" data-testid="emoji-tray">
      {REACTIONS.map((e) => (
        <motion.button
          key={e}
          type="button"
          aria-label={`React ${e}`}
          whileTap={{ scale: 1.35 }}
          onClick={() => onTap(e)}
          className="grid size-10 place-items-center rounded-full bg-muted text-xl transition-colors hover:bg-accent"
        >
          {e}
        </motion.button>
      ))}
    </div>
  );
}

/** Rolling hype level 0–100 from the server's reaction bursts. */
export function HypeMeter({ value, className }: { value: number; className?: string }) {
  return (
    <div className={cn('flex min-w-36 flex-1 items-center gap-2', className)} data-testid="hype-meter" data-value={value}>
      <Flame className={cn('size-5 shrink-0', value > 60 ? 'animate-pulse text-brand' : 'text-muted-foreground')} />
      <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-muted">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-warning via-brand to-brand-dark"
          animate={{ width: `${value}%` }}
          transition={{ type: 'spring', stiffness: 120, damping: 20 }}
        />
      </div>
      <span className="w-10 text-right text-xs font-bold tabular">{value}%</span>
    </div>
  );
}
