import { cn } from '@/lib/utils';

/** Red LIVE pill: a pinging dot plus a soft pulsing glow. */
export function LivePill({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        'live-glow inline-flex items-center gap-1.5 rounded-md bg-brand px-2 py-0.5 font-display text-xs font-bold tracking-wider text-white uppercase',
        className,
      )}
    >
      <span className="relative flex size-1.5">
        <span className="absolute inline-flex size-full animate-ping rounded-full bg-white opacity-75" />
        <span className="relative inline-flex size-1.5 rounded-full bg-white" />
      </span>
      Live
    </span>
  );
}
