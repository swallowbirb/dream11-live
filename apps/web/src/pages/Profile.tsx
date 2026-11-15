import { useQuery } from '@tanstack/react-query';
import { UserAvatar } from '@/components/Header';
import { api } from '@/lib/api';
import type { SessionUser } from '@/lib/session';

export function ProfilePage() {
  const { data } = useQuery({ queryKey: ['me'], queryFn: () => api<{ user: SessionUser }>('/me') });
  if (!data) return <div className="h-24 animate-pulse rounded-2xl bg-muted" />;
  const { user } = data;
  return (
    <div className="flex items-center gap-4 rounded-2xl bg-surface p-6 shadow-sm">
      <UserAvatar name={user.name} className="size-16 text-xl" />
      <div>
        <h1 className="text-2xl font-bold">{user.name}</h1>
        <span className="rounded-full bg-accent px-2 py-0.5 text-xs font-semibold capitalize text-accent-foreground">
          {user.role}
        </span>
      </div>
    </div>
  );
}
