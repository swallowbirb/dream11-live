import { useQuery } from '@tanstack/react-query';
import { Activity } from 'lucide-react';
import { Header } from '@/components/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { api } from '@/lib/api';

type Health = { ok: boolean; time: string; db: { users: number; matches: number } };

function HealthCard() {
  const { data, error, isPending } = useQuery({
    queryKey: ['health'],
    queryFn: () => api<Health>('/health'),
  });
  return (
    <Card className="max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
          <Activity className="size-5 text-brand" /> Server health
        </CardTitle>
      </CardHeader>
      <CardContent className="text-sm" data-testid="health">
        {isPending && <span className="text-muted-foreground">Checking…</span>}
        {error && <span className="text-brand">Server unreachable: {error.message}</span>}
        {data && (
          <div className="space-y-1">
            <p className="font-semibold text-success">● API ok</p>
            <p className="tabular text-muted-foreground">
              {data.db.users} users · {data.db.matches} matches · {new Date(data.time).toLocaleTimeString()}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function App() {
  return (
    <div className="min-h-dvh">
      <Header />
      <main className="mx-auto max-w-6xl space-y-4 px-4 py-6">
        <h1 className="text-3xl font-bold">Scaffold is up</h1>
        <HealthCard />
      </main>
    </div>
  );
}
