// Throwaway LiveKit spike server (M1 S0). Serves index.html, the livekit-client bundle and tokens.
// Run: pnpm start (reads LIVEKIT_URL / LIVEKIT_API_KEY / LIVEKIT_API_SECRET from spike/.env)
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { AccessToken } from 'livekit-server-sdk';

const { LIVEKIT_URL, LIVEKIT_API_KEY, LIVEKIT_API_SECRET } = process.env;
if (!LIVEKIT_URL || !LIVEKIT_API_KEY || !LIVEKIT_API_SECRET) {
  console.error('Missing LIVEKIT_URL / LIVEKIT_API_KEY / LIVEKIT_API_SECRET in spike/.env');
  process.exit(1);
}

const PORT = 5180;
const here = new URL('.', import.meta.url);

createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  try {
    if (url.pathname === '/token') {
      const publish = url.searchParams.get('role') === 'publisher';
      const identity = `${publish ? 'creator' : 'viewer'}-${Math.random().toString(36).slice(2, 7)}`;
      const at = new AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, { identity });
      at.addGrant({ room: 'spike', roomJoin: true, canPublish: publish, canSubscribe: true });
      res.writeHead(200, { 'content-type': 'application/json' });
      return res.end(JSON.stringify({ url: LIVEKIT_URL, token: await at.toJwt(), identity }));
    }
    if (url.pathname === '/livekit-client.mjs') {
      const js = await readFile(new URL('node_modules/livekit-client/dist/livekit-client.esm.mjs', here));
      res.writeHead(200, { 'content-type': 'text/javascript' });
      return res.end(js);
    }
    const html = await readFile(new URL('index.html', here));
    res.writeHead(200, { 'content-type': 'text/html' });
    res.end(html);
  } catch (err) {
    res.writeHead(500);
    res.end(String(err));
  }
}).listen(PORT, () => {
  console.log(`Spike on http://localhost:${PORT}  (publish: ?role=publisher, watch: ?role=viewer)`);
});
