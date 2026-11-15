// Drives spike/index.html: publisher (file + fake cam/mic) and viewer, then checks what the viewer receives.
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const BASE = 'http://localhost:5180';
const file = fileURLToPath(new URL('./test-media/match.webm', import.meta.url));

const browser = await chromium.launch({
  args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream', '--autoplay-policy=no-user-gesture-required'],
});
const ctx = await browser.newContext({ permissions: ['camera', 'microphone'] });

const pub = await ctx.newPage();
pub.on('pageerror', (e) => console.log('[pub pageerror]', e.message));
await pub.goto(`${BASE}/?role=publisher`);
await pub.setInputFiles('#file', file);
await pub.click('#goLive');
await pub.waitForFunction(() => /published microphone|ERROR/.test(document.getElementById('log').textContent), null, { timeout: 30000 });

const view = await ctx.newPage();
view.on('pageerror', (e) => console.log('[view pageerror]', e.message));
await view.goto(`${BASE}/?role=viewer`);
await view.click('#join');
await view.waitForTimeout(8000);

const result = await view.evaluate(async () => {
  const out = {};
  for (const v of document.querySelectorAll('#remote video')) {
    const t0 = v.currentTime;
    await new Promise((r) => setTimeout(r, 1000));
    out[v.dataset.source] = { w: v.videoWidth, h: v.videoHeight, advancing: v.currentTime > t0 };
  }
  const ac = new AudioContext();
  for (const a of document.querySelectorAll('audio')) {
    const an = ac.createAnalyser();
    ac.createMediaStreamSource(a.srcObject).connect(an);
    await new Promise((r) => setTimeout(r, 1500));
    const buf = new Float32Array(an.fftSize);
    an.getFloatTimeDomainData(buf);
    const rms = Math.sqrt(buf.reduce((s, x) => s + x * x, 0) / buf.length);
    out[a.dataset.source] = { rms: +rms.toFixed(4), volume: a.volume };
  }
  // volume slider check: match slider should only change screen_share_audio
  const s = document.getElementById('matchVol');
  s.value = '0.2';
  s.dispatchEvent(new Event('input'));
  out.afterMatchSlider = Object.fromEntries([...document.querySelectorAll('audio')].map((a) => [a.dataset.source, a.volume]));
  return out;
});

console.log('--- publisher log ---\n' + (await pub.textContent('#log')));
console.log('--- viewer log ---\n' + (await view.textContent('#log')));
console.log('--- viewer result ---\n' + JSON.stringify(result, null, 2));
await view.screenshot({ path: fileURLToPath(new URL('./test-media/viewer.png', import.meta.url)), fullPage: true });
await browser.close();
