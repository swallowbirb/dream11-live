# M1 Live core: phase plan

Module 1 from [`plan.md`](../plan.md) §4, broken into phases. One phase per chat. Budget ~2h total.

**Module done when:** two browsers (creator + viewer) do go-live → watch → chat locally.

Rules for every phase: happy path only, typecheck is the check, no tests, commit at the end of each phase.
Anything new goes to `plan.md` §8.

## Status (update at the end of every phase)

**Module 1 is done (2026-11-15).** Module 2 is done too; see [`plans/m2-cricket-hype.md`](m2-cricket-hype.md) for what's next.

| Phase | Status | Handoff notes |
| --- | --- | --- |
| P1 Spike | done (2026-11-15) | Two-track publish + file audio work on LiveKit Cloud. Keys in `spike/.env`. Headless check: `spike/check.mjs` (see `CLAUDE.md` Commands). Register LiveKit listeners before `connect()`. |
| P2 Scaffold | done (2026-11-15) | Workspace, both apps, shared package, full DESIGN §6 schema as migration `init` (camelCase Prisma fields, enum-ish and JSON columns as `String`). `pnpm dev` shows a red header + health card; `pnpm typecheck` clean. Web: `@/` alias → `apps/web/src`, `api()` fetch helper in `src/lib/api.ts`, tokens in `src/index.css` (Tailwind colours `brand`, `brand-dark`, `ink`, `success`, `warning`, `gold`; fonts `font-sans` Inter, `font-display` Barlow Semi Condensed, `tabular` utility; shadcn vars mapped onto them). shadcn added: button, input, card, dialog, slider, sonner, label (shadcn now imports `cn` from the `cn` package). Sonner forced to light theme (next-themes removed). Server: `src/index.ts` (Fastify + Socket.IO on one port), `src/db.ts` (Prisma client). `@d11/shared`: `EV` event names + Zod `SignupBody`, `LoginBody`, `GoLiveBody`, `ChatSend`. React Router is v8 (`createBrowserRouter` from `react-router`); all paths currently render `App`. `livekit-server-sdk` already installed in server. Gotchas: TS pinned ~5.9 (latest is 7); Prisma pinned 6 (7 needs driver adapters); dotenv dropped for `tsx --env-file`. |
| P3 Auth + shell | done (2026-11-15) | Server: `src/auth.ts` has signup/login/logout/me and `requireUser` (preHandler; sets `req.user` = `{ id, name, role, channelId }`), plus `userForToken(token)` for P6's socket auth. bcryptjs (pure JS). Signup as creator also creates the channel. Web: `lib/session.ts` (Zustand persisted as `d11-session`), `lib/api.ts` (`api()` / `post()` add the Bearer header, a 401 clears the session). `pages/Auth.tsx` (login + signup with role cards), `components/AppShell.tsx` (redirects to `/login` when logged out, header + bottom tabs), `components/Header.tsx` (also exports `Logo`, `UserAvatar`), `components/nav.ts`. Routes in `main.tsx`; every page except `/profile` is `pages/Placeholder.tsx` (added `/matches` and `/profile` for the bottom tabs). Gotcha: AuthPage only redirects a logged-in user when the mutation is idle, or the redirect races the post-signup navigate. |
| P4 Go live | done (2026-11-15) | Server: `src/video/provider.ts` (interface) + `src/video/livekit.ts` (tokens; viewer identities get a random suffix), `src/streams.ts` (`GET /api/matches`, `POST /api/streams`, `POST /api/streams/:id/end`, `GET /api/streams/:id`, `GET /api/streams/:id/token` (live only, needs login); also exports `toMatch`/`toStream` mappers). Going live ends any other live stream of the same channel. Shared: `MatchSummary`, `StreamInfo`, `StreamToken`, `TEAM_FLAGS`/`flag()`, `LANGUAGES`. Web: `pages/Dashboard.tsx` (form, file picker + camera toggle via `createLocalTracks`, preview with PiP, play/pause, Go live / End, plus the "Viewer link" from P5 already), `components/LivePill.tsx`. Leaving the dashboard while live ends the stream. Verified headless: LiveKit Cloud room shows camera, mic, screen_share (simulcast), screen_share_audio; after End the room is empty and status is `ended`. The file `<video>` loops, so captured tracks don't end. |
| P5 Player | done (2026-11-15) | `components/player/LivePlayer.tsx` (room + tracks by source, PiP drag via `motion/react` constrained to the frame, PiP / Side by side toggle, Match + Creator volume sliders, "Tap to unmute" when autoplay blocks audio; with one video it's shown full size and the toggle hides) and `pages/Watch.tsx` (stream info bar, offline card when `ended`; the viewer refetches the stream when the creator leaves the room). Dashboard End now calls the API *before* leaving the room, so that refetch already sees `ended`. Verified headless with two browsers: both videos play, both audio tracks carry sound, the PiP drags and stays inside, the Match slider only changes match audio, side by side works, the offline card shows after End. Headless check helpers are in a scratch `lib.mjs` (not in repo); `spike/check.mjs` shows the pattern. |
| P6 Chat | done (2026-11-15) | Server: `src/realtime.ts` (socket auth via `userForToken`, `room:join` → `chat:history` to the joiner + count broadcast, `room:leave`, `chat:send` → Zod → save → `chat:message`, count re-broadcast on `disconnecting`). Every payload carries `streamId`. Viewer count = sockets in `stream:<id>` minus the streamer's (from a cached stream→owner map), not stored in the DB. Web: `lib/socket.ts` (one shared socket, re-created on token change, dropped on logout), `hooks/useStreamRoom.ts` (messages, viewerCount, send), `components/chat/ChatPanel.tsx` (team-badge picker from the match's teams, CREATOR badge, per-name colours, stick-to-bottom scroll), `components/ViewerCount.tsx`. Chat sits right of the player on desktop and under it on mobile; on the dashboard it's under the form while live. Verified headless with 4 browsers: counts 0→1→2→3→1, badges, history for a late joiner, phone layout. |

---

## Before P1 (done)

- [x] LiveKit Cloud project "Dream12"; keys in `spike/.env` (gitignored). P2 copies them to `apps/server/.env`.
- [x] Test media: generated by `pnpm media` in `spike/` (ffmpeg test pattern + tone). Headless Chromium uses a
      fake camera and mic, so no real webcam or video file is needed for checks.
- [x] pnpm 9 installed in `~/.local/bin` (no corepack on this machine). No GitHub remote yet: commits stay local.

---

## P1. LiveKit spike (S0, 20 min) — the risk check

Throwaway, under `spike/`, not part of the app.

- `spike/token.mjs`: uses `livekit-server-sdk` to print two tokens for room `spike` (one publisher, one
  subscriber).
- `spike/index.html`: one page, `livekit-client` from a CDN, token pasted in or read from `?token=`.
  - **Publish mode:** file picker → hidden `<video>` → `captureStream()` → publish its video track as
    `ScreenShare` and audio as `ScreenShareAudio`. Then camera + mic as `Camera` + `Microphone`.
  - **Watch mode:** subscribe, show the screen-share video and camera video side by side, log each track's
    `source`, and play both audio tracks.
- Serve with `npx serve spike` (getUserMedia needs localhost).

**Pass:** second tab sees both videos, hears the file audio, and the sources come through correctly.
**Fail after 20 min:** publish one combined track (file video only + mic), write that in `plan.md` §6, and P4/P5
drop the layout toggle and the second volume slider.

Keep the working publish/subscribe snippets: P4 and P5 copy them.

---

## P2. Scaffold (S1, 25 min)

- pnpm workspace: `apps/web`, `apps/server`, `packages/shared`. Root scripts: `dev` (both apps in parallel),
  `typecheck` (all packages).
- `apps/web`: Vite + React + TS, Tailwind, shadcn/ui init (button, input, card, dialog, slider, sonner),
  React Router, TanStack Query, Zustand, socket.io-client, `livekit-client` + `@livekit/components-react`,
  Lucide. Dream11 tokens from DESIGN §4.1 as CSS variables + Tailwind colours, Inter + Barlow from Google Fonts.
  Vite proxy `/api` and `/socket.io` → server, so there's no CORS.
- `apps/server`: Fastify + Socket.IO on one port, `dotenv`, `GET /api/health`.
- Prisma on SQLite with the **whole** DESIGN §6 schema in one migration (tags/JSON fields as `String`).
- `packages/shared`: socket event name constants and the Zod schemas M1 needs (signup/login, go-live body,
  chat message). More added as later steps need them.
- Fill in the Commands section of `CLAUDE.md`.

**Done when:** `pnpm dev` serves a red-header page that shows the result of `/api/health`, and
`pnpm typecheck` is clean.

---

## P3. Auth + shell (S2, 20 min)

- Server: `POST /api/auth/signup` (creates user, and a channel if role is creator), `POST /api/auth/login`,
  `GET /api/me`. bcrypt, random session token in `sessions`. A small `requireUser` preHandler reading
  `Authorization: Bearer <token>`.
- Web: login / signup pages (name, password, two role cards). Session in a Zustand store persisted to
  `localStorage`; a fetch helper adds the header. Redirect to `/login` when logged out.
- App shell: red header (logo, avatar menu with log out, "Dashboard" link for creators), mobile bottom tabs
  (Home · Matches · Following · Profile). Routes as empty pages: `/`, `/matches/:id`, `/c/:channelId`,
  `/watch/:streamId`, `/dashboard`, `/following`.
- `prisma/seed.ts`: 3 creators, 3 viewers (password `pass` for all), 2 matches (IND vs AUS live, ENG vs NZ
  upcoming). Seed users are listed in `CLAUDE.md` Commands.

**Done when:** signup, logout, login as a seeded user all work, and the shell looks right on desktop and phone width.

---

## P4. Go live: server + creator dashboard (S3 part 1, 20 min)

- Server: `VideoProvider` interface (`getPublishToken`, `getViewerToken`) with a LiveKit implementation.
  Room name = stream id.
  - `POST /api/streams` (creator): creates the stream with status `live` straight away (no `starting` step:
    happy path), returns `{ stream, token, url }`.
  - `POST /api/streams/:id/end`: status `ended`, `ended_at`.
  - `GET /api/streams/:id`: stream + channel + match. `GET /api/streams/:id/token`: viewer token.
  - `GET /api/matches`: for the go-live form's match dropdown.
- Dashboard (`/dashboard`): form (title, match, supporting team from that match's two teams, language),
  file picker and camera toggle, local preview of both, **Go live** / **End stream**, play/pause for the file.
  Publish code copied from the P1 spike.

**Done when:** creator goes live and the stream shows as published in the LiveKit Cloud dashboard; End stops it.

---

## P5. Player page (S3 part 2, 20 min)

- `/watch/:streamId`: fetch stream + viewer token, connect, pick tracks by source. Register `TrackSubscribed`
  listeners **before** `room.connect()`, or tracks already in the room are missed (found in the P1 spike).
- Layout: match video full size, facecam as a draggable PiP (Framer Motion `drag` constrained to the player).
  Toggle: **PiP / Side by side**.
- Two volume sliders: **Match** (screen-share audio) and **Creator** (mic), each setting its audio element's
  volume.
- Header bar under the player: title, creator name, match name. An "offline" card when the stream is `ended`.
- Temporary: the dashboard shows a "Viewer link" to `/watch/:id` (home lists live streams in M2).

**Done when:** a second browser logged in as a viewer sees and hears both parts, drags the PiP, switches
layout and mixes audio.

---

## P6. Chat + viewer count (S4, 15 min)

- Socket.IO auth: session token in `handshake.auth`, user loaded on connect.
- `room:join` / `room:leave` (`streamId`). On join, the server sends the last 50 messages.
- `chat:send` `{ body, teamBadge }` → Zod check → save `chat_messages` → `chat:message` to the room with
  `{ id, user: { name, isCreator }, body, teamBadge, createdAt }`.
- `stream:status` `{ viewerCount }` to the room on every join/leave (room size, no DB).
- Chat panel component used on the player (right on desktop, under the player on mobile) and the dashboard:
  messages, input, team badge picker (the match's two teams, flag emoji), creator badge on the streamer's
  messages. Viewer count on both pages.

**Done when:** creator and viewer chat in real time with badges, and the viewer count moves as tabs open and close.

---

## Module close (5 min) — done 2026-11-15

- [x] Click-through of the module's "done when" in two browsers (headless: creator + 3 viewers, go live → watch → chat → end).
- [x] `plan.md` §9: M1 steps marked done. Nothing was cut.

## Phase timing

| Phase | Step | Time |
| --- | --- | --- |
| P1 | S0 spike | 20 |
| P2 | S1 scaffold | 25 |
| P3 | S2 auth + shell | 20 |
| P4 | S3 go live (server + dashboard) | 20 |
| P5 | S3 player | 20 |
| P6 | S4 chat | 15 |
| | **Total** | **~2h** |

If behind at P5: drop the layout toggle (PiP only), per `plan.md` §7.
