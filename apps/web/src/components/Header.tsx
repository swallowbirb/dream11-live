import { Link, NavLink, useNavigate } from 'react-router';
import { LayoutDashboard, LogOut, User } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { post } from '@/lib/api';
import { disconnectSocket } from '@/lib/socket';
import { useSession } from '@/lib/session';
import { cn } from '@/lib/utils';
import { navItems } from './nav';

export function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2">
      <span className="grid size-8 place-items-center rounded-lg bg-white font-display text-lg font-extrabold text-brand">
        D
      </span>
      <span className="font-display text-xl font-bold tracking-tight">
        Dream11 <span className="font-semibold opacity-80">Live</span>
      </span>
    </Link>
  );
}

export function UserAvatar({ name, className }: { name: string; className?: string }) {
  return (
    <Avatar className={className}>
      <AvatarFallback className="bg-ink font-display font-bold text-white">{name.slice(0, 2).toUpperCase()}</AvatarFallback>
    </Avatar>
  );
}

export function useLogout() {
  const clear = useSession((s) => s.clear);
  const navigate = useNavigate();
  const qc = useQueryClient();
  return async () => {
    await post('/auth/logout').catch(() => {});
    disconnectSocket();
    clear();
    qc.clear();
    navigate('/login');
  };
}

export function Header() {
  const user = useSession((s) => s.user);
  const navigate = useNavigate();
  const logout = useLogout();

  return (
    <header className="sticky top-0 z-40 bg-brand text-white shadow-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-6 px-4">
        <Logo />
        <nav className="hidden gap-1 md:flex">
          {navItems.slice(0, 3).map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                cn('rounded-md px-3 py-1.5 text-sm font-semibold transition', isActive ? 'bg-white/20' : 'hover:bg-white/10')
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          {user?.role === 'creator' && (
            <Button asChild size="sm" className="bg-white font-semibold text-brand hover:bg-white/90">
              <Link to="/dashboard">
                <LayoutDashboard /> <span className="hidden sm:inline">Dashboard</span>
              </Link>
            </Button>
          )}
          {user && (
            <DropdownMenu>
              <DropdownMenuTrigger className="rounded-full ring-2 ring-white/40 transition hover:ring-white" aria-label="Account">
                <UserAvatar name={user.name} className="size-8" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel>
                  <div className="font-semibold">{user.name}</div>
                  <div className="text-xs font-normal capitalize text-muted-foreground">{user.role}</div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {user.channelId && (
                  <DropdownMenuItem onSelect={() => navigate(`/c/${user.channelId}`)}>
                    <User /> My channel
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onSelect={logout}>
                  <LogOut /> Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </header>
  );
}
