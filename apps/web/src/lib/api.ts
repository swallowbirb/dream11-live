import { useSession } from './session';

// Fetch helper for the same-origin API (Vite proxies /api to the server). Adds the session token.
export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const token = useSession.getState().token;
  const res = await fetch(`/api${path}`, {
    ...init,
    headers: {
      ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init?.headers,
    },
  });
  if (res.status === 401 && token) useSession.getState().clear();
  if (!res.ok) throw new Error((await res.json().catch(() => null))?.error ?? res.statusText);
  return res.json() as Promise<T>;
}

export const post = <T,>(path: string, body?: unknown) =>
  api<T>(path, { method: 'POST', body: JSON.stringify(body ?? {}) });
