import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { ChevronRight, Heart, LayoutDashboard, LogOut, Tv } from 'lucide-react';
import { UserAvatar, useLogout } from '@/components/Header';
import { useFollowing } from '@/pages/Following';
import { api } from '@/lib/api';
import type { SessionUser } from '@/lib/session';

function Item({ to, icon, label, note }: { to: string; icon: ReactNode; label: string; note?: ReactNode }) {
  return (
    <Link to={to} className="flex items-center gap-3 px-4 py-3.5 transition hover:bg-muted/60 active:bg-muted">
      <span className="grid size-9 place-items-center rounded-full bg-accent text-brand">{icon}</span>
      <span className="flex-1 font-semibold">{label}</span>
      {note && <span className="text-sm text-muted-foreground tabular">{note}</span>}
      <ChevronRight className="size-4 text-muted-foreground" />
    </Link>
  );
}

export function ProfilePage() {
  const { data } = useQuery({ queryKey: ['me'], queryFn: () => api<{ user: SessionUser }>('/me') });
  const following = useFollowing();
  const logout = useLogout();

  if (!data)
    return (
      <div className="mx-auto max-w-xl space-y-4">
        <div className="h-28 animate-pulse rounded-2xl bg-muted" />
        <div className="h-40 animate-pulse rounded-2xl bg-muted" />
      </div>
    );
  const { user } = data;
  const live = following.data?.channels.filter((c) => c.live).length ?? 0;
  const total = following.data?.channels.length;

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <div className="overflow-hidden rounded-2xl bg-surface shadow-sm">
        <div className="h-16 bg-gradient-to-r from-brand to-brand-dark" />
        <div className="flex items-end gap-4 px-5 pb-5">
          <UserAvatar name={user.name} className="-mt-8 size-16 text-xl ring-4 ring-surface" />
          <div>
            <h1 className="text-2xl font-bold leading-tight">{user.name}</h1>
            <span className="rounded-full bg-accent px-2 py-0.5 text-xs font-semibold capitalize text-accent-foreground">
              {user.role}
            </span>
          </div>
        </div>
      </div>

      <nav className="divide-y overflow-hidden rounded-2xl bg-surface shadow-sm">
        {user.channelId && (
          <>
            <Item to={`/c/${user.channelId}`} icon={<Tv className="size-4" />} label="My channel" />
            <Item to="/dashboard" icon={<LayoutDashboard className="size-4" />} label="Creator dashboard" />
          </>
        )}
        <Item
          to="/following"
          icon={<Heart className="size-4" />}
          label="Following"
          note={total === undefined ? null : live ? `${live} live · ${total}` : total}
        />
      </nav>

      <button
        type="button"
        onClick={logout}
        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-surface px-4 py-3.5 font-semibold text-brand shadow-sm transition hover:bg-accent active:scale-[0.99]"
      >
        <LogOut className="size-4" /> Log out
      </button>
    </div>
  );
}
