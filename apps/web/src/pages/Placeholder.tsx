import type { ReactNode } from 'react';
import { useParams } from 'react-router';
import { Construction } from 'lucide-react';

/** Empty page used until a later phase builds the real one. */
export function Placeholder({ title, note }: { title: string; note?: ReactNode }) {
  const params = useParams();
  const id = Object.values(params).find(Boolean);
  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold">{title}</h1>
      <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed bg-surface p-10 text-center text-muted-foreground">
        <Construction className="size-8 text-brand" />
        <p className="font-medium">{note ?? 'Coming up in a later phase.'}</p>
        {id && <p className="font-mono text-xs">{id}</p>}
      </div>
    </div>
  );
}
