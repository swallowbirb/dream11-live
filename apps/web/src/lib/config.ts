/** Server origin when the web app is hosted apart from it (Vercel + Render). Empty = same origin (dev proxy, one-service deploy). */
export const API_URL = ((import.meta.env.VITE_API_URL as string | undefined) ?? '').replace(/\/$/, '');
