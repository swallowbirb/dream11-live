// Fetch helper for the same-origin API (Vite proxies /api to the server).
export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`/api${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  });
  if (!res.ok) throw new Error((await res.json().catch(() => null))?.error ?? res.statusText);
  return res.json() as Promise<T>;
}
