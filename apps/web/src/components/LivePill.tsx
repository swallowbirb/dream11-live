import { cn } from '@/lib/utils';

export function LivePill({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-md bg-brand px-2 py-0.5 font-display text-xs font-bold tracking-wider text-white uppercase',
        className,
      )}
    >
      <span className="size-1.5 animate-pulse rounded-full bg-white" />
      Live
    </span>
  );
}
