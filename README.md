# Dream11 Live

**Live demo: [dream11-live.vercel.app](https://dream11-live.vercel.app)**

A real-time cricket streaming platform: creators broadcast match watch-alongs and fans react together.
A creator goes live with two independent WebRTC sources (match feed and facecam). Viewers watch with a draggable
picture-in-picture or side-by-side layout and their own audio mix, while chat, emoji reactions, a hype meter,
polls and a ball-by-ball scorecard update live.

> The web app is hosted on Vercel and the real-time server on Render's free plan. The first request after the
> server has been idle can take about a minute while it wakes up.

## Product note

The fan problem, product hypothesis, design choices and AI tools are in [SHORT_NOTE.md](SHORT_NOTE.md).

## Try it

| Account | Password | Role |
| --- | --- | --- |
| `priya`, `arjun`, `sam` | `pass` | Viewer |
| `RohitReacts`, `AussieAnalyst`, `CoverDriveComedy` | `pass` | Creator |

Or sign up with your own name. Six creator streams are always live, with chat, reactions, polls and a ticking
IND vs AUS scorecard, so there is something to watch straight away. To go live yourself, log in as a creator,
open the dashboard, pick a video file and allow the camera.

## Features

- **Going live:** a local video file (`captureStream()`) and a webcam, published as separate LiveKit tracks.
- **Watching:** draggable PiP or side by side, separate volume sliders for match audio and creator voice.
- **Chat:** real time, with team, CREATOR and SUB badges; the creator can delete messages and ban users.
- **Reactions:** six emojis float over the video; a hype meter tracks a rolling 5-second window.
- **Polls:** the creator opens one, viewers vote once, and results update live on the video.
- **Live scores:** a ball-by-ball match feed, fanned out to every stream on that match.
- **Discovery:** home, matches, and a match hub with every creator streaming it.
- **Social:** follow, a Following page, go-live toasts, and three subscription tiers with a checkout dialog.
- **Demo mode:** a server-side bot director keeps six streams live with persona-driven chat, event-reactive
  hype and self-running polls.

## Tech stack

| Layer | Technology |
| --- | --- |
| Frontend | React 19, Vite 8, TypeScript, Tailwind CSS 4, shadcn/ui (Radix), TanStack Query, Zustand, Motion |
| Backend | Node.js 22, Fastify 5, Socket.IO 4, Zod 4 |
| Data | Prisma 6 on SQLite (switches to Postgres with one line) |
| Video | LiveKit Cloud (WebRTC SFU), livekit-client, livekit-server-sdk |
| Tooling | pnpm workspaces, strict TypeScript, Playwright (headless end-to-end checks), FFmpeg |
| Hosting | Vercel (web), Render via Docker (server) |

## Architecture

```
 Creator studio ──4 tracks──▶ LiveKit Cloud SFU ──subscribe──▶ Viewer
       │                          ▲  (scoped tokens)                │
       └──── REST + Socket.IO ────┼──────── REST + Socket.IO ───────┘
                                  │
   Node.js service:  Fastify REST · Socket.IO rooms · Match feed · Bot director
                                  │
                           Prisma + SQLite
```

Video and audio go through LiveKit; app state, chat, reactions, polls and scores go through one Node.js service.
`packages/shared` holds every socket event name, payload type and Zod schema, so the client and server share one
contract.

## Run locally

Requires Node.js 22+, pnpm 9 and a free LiveKit Cloud project.

```bash
pnpm install
cp apps/server/.env.example apps/server/.env   # fill in the LIVEKIT_* values
pnpm db:migrate && pnpm db:seed
pnpm dev                                        # web on http://localhost:5173, server on :3001
```

`pnpm typecheck` checks all three packages. `pnpm replay start` restarts the match replay.

## Deploy

- **Web (Vercel):** `vercel.json` builds `apps/web`. Set `VITE_API_URL` to the server's URL.
- **Server (Render):** `render.yaml` + `Dockerfile` (New, then Blueprint). Set the three `LIVEKIT_*` values.
  `CORS_ORIGIN` already allows `https://*.vercel.app`.
- **One service:** `pnpm build && pnpm start` serves the web app, API and sockets from one origin.

## Repository

```
apps/web         React app: pages, player, chat, reactions, polls
apps/server      Fastify + Socket.IO server, Prisma schema, match feed, bot director
packages/shared  Shared event names, types and Zod schemas
spike/           The WebRTC proof of concept, with a headless publish-and-watch test
DESIGN.md        System design: scope, architecture, data model, API
plan.md          Delivery plan and progress
```

Demo footage: Pixabay (free licence), sources in `apps/web/public/bots/CREDITS.txt`.
