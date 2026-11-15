import { Eye } from 'lucide-react';

export function ViewerCount({ count }: { count: number }) {
  return (
    <span className="inline-flex items-center gap-1 text-sm font-semibold text-brand tabular" data-testid="viewer-count">
      <Eye className="size-4" />
      {count.toLocaleString()}
    </span>
  );
}
