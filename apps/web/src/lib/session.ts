import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { PublicUser } from '@d11/shared';

export type SessionUser = PublicUser & { channelId: string | null };

type SessionState = {
  token: string | null;
  user: SessionUser | null;
  setSession: (token: string, user: SessionUser) => void;
  clear: () => void;
};

export const useSession = create<SessionState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      setSession: (token, user) => set({ token, user }),
      clear: () => set({ token: null, user: null }),
    }),
    { name: 'd11-session' },
  ),
);
