import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router';
import { useMutation } from '@tanstack/react-query';
import { Clapperboard, Tv } from 'lucide-react';
import { toast } from 'sonner';
import type { Role } from '@d11/shared';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { post } from '@/lib/api';
import { useSession, type SessionUser } from '@/lib/session';
import { cn } from '@/lib/utils';

const roles: { role: Role; title: string; blurb: string; Icon: typeof Tv }[] = [
  { role: 'creator', title: "I'm a Creator", blurb: 'Go live and react to matches', Icon: Clapperboard },
  { role: 'viewer', title: "I'm a Viewer", blurb: 'Watch, chat and react', Icon: Tv },
];

export function AuthPage({ mode }: { mode: 'login' | 'signup' }) {
  const navigate = useNavigate();
  const { token, setSession } = useSession();
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<Role>('viewer');

  const submit = useMutation({
    mutationFn: () =>
      post<{ token: string; user: SessionUser }>(
        `/auth/${mode}`,
        mode === 'signup' ? { name, password, role } : { name, password },
      ),
    onSuccess: ({ token, user }) => {
      setSession(token, user);
      toast.success(`Welcome${mode === 'login' ? ' back' : ''}, ${user.name}!`);
      navigate(user.role === 'creator' && mode === 'signup' ? '/dashboard' : '/');
    },
    onError: (e) => toast.error(e.message),
  });

  // Only on a fresh visit: after submit, onSuccess navigates (creators to /dashboard).
  if (token && submit.isIdle) return <Navigate to="/" replace />;
  const isSignup = mode === 'signup';

  return (
    <div className="flex min-h-dvh flex-col bg-gradient-to-b from-brand to-brand-dark">
      <div className="flex flex-1 flex-col items-center justify-center px-4 py-10">
        <div className="mb-6 flex items-center gap-2 text-white">
          <span className="grid size-10 place-items-center rounded-xl bg-white font-display text-2xl font-extrabold text-brand">
            D
          </span>
          <span className="font-display text-3xl font-bold tracking-tight">
            Dream11 <span className="font-semibold opacity-80">Live</span>
          </span>
        </div>
        <form
          className="w-full max-w-md space-y-5 rounded-2xl bg-surface p-6 shadow-2xl"
          onSubmit={(e) => {
            e.preventDefault();
            submit.mutate();
          }}
        >
          <div>
            <h1 className="text-2xl font-bold">{isSignup ? 'Create your account' : 'Log in'}</h1>
            <p className="text-sm text-muted-foreground">
              {isSignup ? 'Watch cricket with the creators you love.' : 'Good to see you again.'}
            </p>
          </div>

          {isSignup && (
            <div className="grid grid-cols-2 gap-3">
              {roles.map(({ role: r, title, blurb, Icon }) => (
                <button
                  key={r}
                  type="button"
                  data-role={r}
                  onClick={() => setRole(r)}
                  className={cn(
                    'rounded-xl border-2 p-3 text-left transition active:scale-[0.98]',
                    role === r ? 'border-brand bg-accent' : 'border-border hover:border-brand/40',
                  )}
                >
                  <Icon className={cn('mb-2 size-6', role === r ? 'text-brand' : 'text-muted-foreground')} />
                  <div className="font-display text-base font-bold">{title}</div>
                  <div className="text-xs text-muted-foreground">{blurb}</div>
                </button>
              ))}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" autoComplete="username" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              autoComplete={isSignup ? 'new-password' : 'current-password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <Button type="submit" size="lg" className="w-full font-semibold" disabled={submit.isPending}>
            {isSignup ? 'Sign up' : 'Log in'}
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            {isSignup ? 'Already have an account? ' : 'New here? '}
            <Link to={isSignup ? '/login' : '/signup'} className="font-semibold text-brand hover:underline">
              {isSignup ? 'Log in' : 'Sign up'}
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
