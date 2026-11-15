import { AccessToken } from 'livekit-server-sdk';
import type { VideoProvider } from './provider';

const { LIVEKIT_URL, LIVEKIT_API_KEY, LIVEKIT_API_SECRET } = process.env;
if (!LIVEKIT_URL || !LIVEKIT_API_KEY || !LIVEKIT_API_SECRET) {
  throw new Error('Missing LIVEKIT_URL / LIVEKIT_API_KEY / LIVEKIT_API_SECRET in apps/server/.env');
}

async function token(room: string, identity: string, name: string, canPublish: boolean) {
  const at = new AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, { identity, name, ttl: '6h' });
  at.addGrant({ room, roomJoin: true, canPublish, canSubscribe: true, canPublishData: false });
  return at.toJwt();
}

export const livekit: VideoProvider = {
  url: LIVEKIT_URL,
  getPublishToken: (room, identity, name) => token(room, identity, name, true),
  // Viewer identities get a random suffix so the same user can watch from two tabs.
  getViewerToken: (room, identity, name) =>
    token(room, `${identity}-${Math.random().toString(36).slice(2, 7)}`, name, false),
};
