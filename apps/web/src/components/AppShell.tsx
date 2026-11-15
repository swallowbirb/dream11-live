import { Navigate, NavLink, Outlet, useLocation } from 'react-router';
import { useSession } from '@/lib/session';
import { cn } from '@/lib/utils';
import { Header } from './Header';
import { navItems } from './nav';

function BottomTabs() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t bg-surface pb-[env(safe-area-inset-bottom)] md:hidden">
      <div className="grid grid-cols-4">
        {navItems.map(({ to, label, Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              cn(
                'flex flex-col items-center gap-0.5 py-2 text-[11px] font-semibold transition active:scale-95',
                isActive ? 'text-brand' : 'text-muted-foreground',
              )
            }
          >
            <Icon className="size-5" />
            {label}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}

/** Logged-in layout: red header, page, mobile bottom tabs. Redirects to /login when logged out. */
export function AppShell() {
  const token = useSession((s) => s.token);
  const location = useLocation();
  if (!token) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  return (
    <div className="min-h-dvh pb-16 md:pb-0">
      <Header />
      <main className="mx-auto max-w-6xl px-4 py-6">
        <Outlet />
      </main>
      <BottomTabs />
    </div>
  );
}
