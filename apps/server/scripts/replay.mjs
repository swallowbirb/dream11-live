// pnpm replay [start [speed] | stop | status]. Speed is a multiple of real time (default 10 = 3 s a ball).
// Against a deployed site: SITE=https://your-app.example pnpm replay
const [cmd = 'start', speed] = process.argv.slice(2);
const base = `${process.env.SITE ?? `http://localhost:${process.env.PORT ?? 3001}`}/api/replay`;
const res =
  cmd === 'status'
    ? await fetch(base)
    : await fetch(`${base}/${cmd}`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(speed ? { speed: Number(speed) } : {}),
      });
console.log(res.status, await res.text());
