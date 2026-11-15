# Cricket Live Reaction Platform: Design Doc

**Status:** Draft v2 · 2026-11-15 (tech stack decided)
**Scope:** Prototype. The 4–5 hour build order and the features cut from "Build now" are in [`plan.md`](plan.md).

> One line: a platform where cricket creators react live, and fans watch, chat and share the excitement together.

---

## 1. Overview

A live-streaming platform for cricket, modelled on Twitch. Creators stream **the match itself** with their own
camera and commentary on top, the way a gamer streams a game on Twitch. Viewers join, watch, chat and send instant
emoji reactions, and the creator responds live.

The core mechanics (channels, going live, following, chat, clips, subscriptions) work like Twitch. On top of that
the platform adds cricket-specific features: match pages, team badges, a live scorecard and polls.

### What "prototype" means here

| Layer | Bar |
| --- | --- |
| **Frontend** | **Production-quality look and feel.** Polished, animated, responsive, consistent. It should feel like a shipped app. |
| **Backend** | Prototype. Simplest thing that works: no real auth, no payments, no scaling work, no hardening. |

---

## 2. Users and roles

There is no real authentication. A user signs up by typing a **name**, a **password** and choosing a **role**. The
record is saved to the database, and logging in matches name + password against that record.

| Role | Can do |
| --- | --- |
| **Creator** | Everything a viewer can, plus: own a channel, go live, run polls, moderate their own chat, set up subscription tiers |
| **Viewer** | Browse, watch, chat, react, follow, clip, vote in polls, "subscribe" (mock) |

- Session: after login the server returns a simple session token (random string stored in a `sessions` table),
  kept in `localStorage` and sent with requests and on the WebSocket connection.
- Note: storing the password as a bcrypt hash costs one line of code and avoids plaintext in the DB. Recommended
  even for the prototype.

---

## 3. Feature scope

### 3.1 Build now

**Channels and following**
- A creator channel page: avatar, banner, bio, tags (language, style such as *Analysis / Hype / Comedy*, favourite
  team), follower count, live player or offline banner, recent clips.
- Follow / unfollow. A "Following" page shows followed creators, live ones first.
- Go-live notifications: an in-app notification (bell + toast) when a followed creator goes live.

**Going live**
- A stream has two parts: the **match feed** (video + match audio) and the **facecam** (camera + mic). Either can be
  off: a creator can stream match only, facecam only, or both.
- **Browser go-live** is the only way to go live in the prototype. The creator picks a match source and a facecam:
  - **Screen / tab share** (`getDisplayMedia`, with tab audio): share the tab or window the match is playing in.
  - **Local video file:** pick a file from disk. The page plays it in a hidden `<video>` and publishes it with
    `captureStream()`, with play, pause and seek controls in the dashboard. This is how the prototype is tested with
    downloaded older matches, with several test accounts each streaming a different file.
  - **Camera + mic** for the facecam.
  - Match and facecam are published as **separate tracks** (LiveKit), and the viewer's player arranges them (see
    *Watching*).
- The go-live form asks for: stream title, **linked match**, **supporting team** (optional), language and tags.
- A creator dashboard with a stream preview, a chat panel, a viewer count, a reaction "hype meter", poll controls and
  a mod log.

**Matches (the "categories" of this platform)**
- Match data (fixtures, status and live score) comes from a cricket data API and is cached by the backend.
- **Match page as a hub:** a header with teams, score and status, then a grid of every creator streaming this match,
  filterable by language and style.
- Home page: live matches with creator counts, then upcoming matches, then live followed creators.

**Watching**
- Player page: the video, a **live scorecard strip** (score, overs, current batters/bowler, last 6 balls), the
  creator's info + follow/subscribe buttons, and chat.
- **Layouts** for browser streams (separate tracks): match full-size with a draggable, resizable **facecam
  picture-in-picture** (default), side by side, or facecam only. The creator sets the default; each viewer can change
  it for themselves.
- **Audio mix:** separate volume sliders for **match audio** and **creator voice**, so viewers can turn the
  commentary down and the creator up, or the other way round.
- Fullscreen and theatre mode (chat beside a larger player).

**Chat**
- Real-time chat per stream with emotes.
- **Team badges:** each viewer can pick a team flair for the match (🇮🇳 / 🇦🇺 …), shown next to their name.
- Role badges: creator, moderator, subscriber.
- **Emoji bursts:** tap a reaction (🔥 😱 👏 🏏 😂 💔) and it floats up over the video. The backend aggregates taps and
  broadcasts counts, which also drive a hype meter.

**Polls**
- The creator starts a poll ("Will India chase 180?"), viewers vote once each, results update live in chat and on
  the player overlay, and the creator ends the poll.

**Clips**
- Any viewer can clip the last ~30 seconds of a live stream and give it a title. Clips appear on the channel page and
  the match page.

**Subscriptions (mock, no transactions)**
- A creator configures up to 3 tiers (name, display price, perks text, badge).
- A viewer clicks Subscribe, sees a polished checkout-style modal, confirms, and the subscription is recorded
  immediately. No payment is processed.
- Effects: a subscriber badge in chat, a "subscribers only" chat mode, and the creator sees their subscriber list.
- Unsubscribe at any time.

**Moderation (basic)**
- The creator can promote viewers to **moderator**.
- The creator and mods can **delete a message**, **time out** a user (1 / 5 / 10 min), **ban** or unban a user, and
  turn on **slow mode** (N seconds between messages), **subscribers-only mode** or **followers-only mode**.
- A **word filter**: a per-channel blocked-word list, where matching messages are rejected.
- A **mod log** listing every moderation action in the dashboard.

### 3.2 Later (TODO)
- **Reaction Wall:** a grid of many creators reacting to the same ball. Needs more live creators than testing can
  supply right now.
- **OBS support:** an RTMP stream key through LiveKit Ingress, for creators who want their own layout in OBS. OBS
  merges everything into one video, so per-viewer layouts and the audio mix won't apply to OBS streams. Add a
  `stream_key` column to `channels` and a `createIngest` method to `VideoProvider`.
- **Auto-clips** triggered by score events (wicket, six, last ball).
- **Predictions** with points and per-stream leaderboards.
- **Real payments** for subscriptions, plus UPI tipping.
- Mobile apps and other sports.
- Cross-platform delay sync.

### 3.3 To add later, maybe
- **VODs** (past broadcasts saved to the channel).

### 3.4 Out of scope
- Raids.
- Real authentication (OAuth, email verification, password reset).

---

## 4. UI and visual design

The goal is a **Dream11-style** look: a bold red brand, a clean light canvas, crisp white cards and a sporty,
confident feel. Take inspiration from Twitch for layout patterns (player + chat, browse grids, creator dashboard),
but the visual identity is Dream11's.

### 4.1 Colour tokens

Hex values are approximations of the Dream11 palette. Check them against the Dream11 app or brand assets before
locking them in.

| Token | Use | Value (approx) |
| --- | --- | --- |
| `--brand` | Header, primary buttons, LIVE pill, active tab | `#D11F26` red |
| `--brand-dark` | Hover/pressed, gradients | `#A3161B` |
| `--ink` | Header on dark sections, headings | `#1B1B1B` near-black |
| `--bg` | Page background | `#F4F4F5` light grey |
| `--surface` | Cards, panels, chat | `#FFFFFF` |
| `--text` | Body text | `#222222` |
| `--muted` | Secondary text, meta | `#6B6B6B` |
| `--border` | Dividers, card borders | `#E5E5E7` |
| `--success` | Votes, success toasts, "subscribed" | `#1E9E4A` green |
| `--warning` | "Upcoming" / "starts in" chips | `#F2A516` amber |
| `--gold` | Subscriber badge, premium tiers | `#C9A227` |

- Team colours are **accents only**: team badges, "supporting" chips, the scorecard team strip.
- Dark mode: dark charcoal surfaces (`#121212` / `#1E1E1E`) with the same red brand. Nice to have; light first.

### 4.2 Style rules
- **Header:** a solid red top bar with the logo, search, notifications bell and avatar. On mobile, a bottom tab bar:
  *Home · Matches · Following · Profile*.
- **Cards:** 12–16px radius, soft shadow, white on grey.
- **Match card:** a "Team A **vs** Team B" layout with crests/flags, a status chip (`● LIVE` red / `Starts in 2h`
  amber / `Completed` grey), a mini score, and "23 creators live".
- **Creator card:** a thumbnail with a LIVE pill and viewer count, avatar, name, title, language/style tags.
- **Typography:** a bold, condensed-feeling sans for headings and scores (e.g. *Inter* / *Barlow*), with tabular
  numerals for scores and counts.
- **Motion:** emoji bursts float up and fade; scorecard values tick; the LIVE pill pulses; skeleton loaders
  everywhere instead of spinners; buttons get press feedback.
- **Responsive:** mobile-first. Chat sits under the player on mobile and in a side panel on desktop.
- **Empty states are designed, not blank:** "No one is live for this match yet — be the first."

### 4.3 Screens

1. **Sign up / Log in:** name, password and a role picker (two big cards: *I'm a Creator* / *I'm a Viewer*).
2. **Home:** live matches carousel, top live streams, upcoming matches, followed creators who are live.
3. **Matches:** tabs for Live / Upcoming / Completed, plus a tournament filter.
4. **Match page:** match header with score, filter chips (language, style), creator grid.
5. **Player page:** video, emoji tray, scorecard strip, creator bar (follow / subscribe), chat, poll overlay.
6. **Channel page:** banner, about section, live player or offline card, clips, subscription tiers.
7. **Following:** live first, then offline creators.
8. **Creator dashboard:** go-live setup (source picker: screen/tab or file, camera, mic), preview, chat with mod actions, viewer count, hype
   meter, poll controls, mod settings (slow mode, word filter, mods list), subscriber list, tier editor.
9. **Subscribe modal:** tier cards and a mock checkout confirmation.
10. **Clip viewer:** clip player, title, creator, linked match, share button.

---

## 5. Architecture

### 5.1 Tech stack (decided)

**Frontend**

| Piece | Choice | Why |
| --- | --- | --- |
| Framework | **Vite + React + TypeScript** (SPA) | No SEO needs and a separate backend, so a framework with server rendering adds nothing |
| Styling | **Tailwind CSS** + **shadcn/ui** | Dream11 tokens become Tailwind theme colours; shadcn gives polished, accessible components we own and restyle |
| Animation | **Framer Motion** (Motion) | Emoji bursts, ticking scores, page transitions |
| Server state | **TanStack Query** | Caching, refetching, skeleton loaders |
| Client state | **Zustand** | Chat buffer, reaction counts, session |
| Routing | **React Router** | |
| Realtime | **socket.io-client** | Matches the backend |
| Video UI | **LiveKit React components** | Browser go-live and the viewer player |
| Icons / fonts | **Lucide**; **Inter** / **Barlow** (Google Fonts) | |

**Backend**

| Piece | Choice | Why |
| --- | --- | --- |
| Runtime | **Node.js + TypeScript** | One language across the stack |
| HTTP | **Fastify** | Light and fast, little ceremony |
| Realtime | **Socket.IO** | Rooms per stream, reconnection and acks built in |
| ORM | **Prisma** | The schema file is the data model, with migrations and typed queries |
| Database | **PostgreSQL** (SQLite allowed for local dev) | Relational data with simple joins |
| Validation | **Zod** | Shared schemas validate REST bodies and socket payloads |
| Redis | **Not used** | One server process: reaction counters, slow-mode timers and timeouts live in memory. Add Redis only when running more than one instance. |

**Services and hosting**

| Piece | Choice | Notes |
| --- | --- | --- |
| Video | **LiveKit Cloud** | Browser go-live (WebRTC), recording via **Egress** for clips. OBS support later via LiveKit **Ingress** (RTMP). Viewers watch over WebRTC; fine at prototype scale. Kept behind a `VideoProvider` adapter so it can be swapped later. |
| Match data | **Replay feed first**, real cricket API later | See 5.4 |
| Frontend hosting | **Vercel** (static SPA) | |
| Backend hosting | **Railway** | Must be a long-running server: WebSockets don't work on serverless functions |
| Database hosting | **Railway Postgres** (or Neon) | |

**Repo layout:** a pnpm monorepo.

```
apps/web          Vite + React frontend
apps/server       Fastify + Socket.IO backend, Prisma schema
packages/shared   Socket event names, payload types, Zod schemas, shared constants
```

`packages/shared` keeps the client and server agreeing on every event and payload.

### 5.2 System sketch

```
 Browser (viewer/creator)
   │  HTTPS (REST)          WebSocket (chat, reactions, polls, notifications)
   ▼                         ▼
 ┌──────────────────────────────────────────────┐
 │         Backend (Node · Fastify · Socket.IO)  │
 │  REST API · socket rooms · in-memory counters │
 │  MatchFeed job · LiveKit webhooks             │
 └──────┬───────────────┬───────────────┬───────┘
        │               │               │
   PostgreSQL      LiveKit Cloud     MatchFeed
   (Prisma)        ▲ publish/egress  ├─ ReplayFeed (recorded match, ball by ball)
                   │                 └─ ApiFeed (cricket data API, later)
          browser (WebRTC)
```

### 5.3 Key flows

**Go live**
1. The creator fills in the go-live form and the backend creates a `stream` row (status `starting`).
2. The backend asks the video provider for a WebRTC publish token and returns it.
3. When the provider signals the stream is active (webhook or polling), the status becomes `live`. Followers get a
   notification and the stream appears on the match page.
4. When the stream ends, the status becomes `ended` and the stream leaves the listings.

**Chat message**
1. The client emits `chat:send` → the server checks for a ban or timeout, slow mode, sub-only/follower-only mode and
   the word filter.
2. If allowed, the message is saved and broadcast to the stream's room as `chat:message`. If not, the sender gets
   `chat:rejected` with a reason.

**Emoji reactions**
1. The client batches taps locally and emits `reaction:batch` (e.g. `{ "🔥": 3 }`) at most every 250ms.
2. The server adds the batch to an in-memory counter per stream and flushes `reaction:burst` with the totals to the
   room every 250ms. Clients animate based on the counts, and the hype meter is a rolling average.

**Clip**
1. The viewer clicks Clip → `POST /streams/:id/clips` with a title.
2. The backend asks the video provider for the last 30s of the recording (or stores timestamps against the
   recording and trims on playback) and saves a `clip` row.

**Mock subscription**
1. `POST /channels/:id/subscribe` with a tier → a `subscription` row is created (status `active`).
2. The subscriber badge appears immediately.

**Match data**
1. The active `MatchFeed` produces fixtures and ball-by-ball score updates (see 5.4).
2. The backend upserts `matches` and broadcasts `score:update` to every stream room linked to that match.

### 5.4 Match feed

Match data sits behind a `MatchFeed` interface with two implementations:

- **ReplayFeed (build first):** plays a recorded match from a JSON file, ball by ball, at a configurable speed
  (real time, 2×, 10×). It can be started from an admin endpoint or a script, so a "live IPL final" can be staged
  at any time for demos and testing, and the frontend can be built without a third-party API.
- **ApiFeed (later):** polls a cricket data API (CricketData.org, Roanuz, Sportmonks, Entity Sport) for fixtures
  daily and live scores every 10–30s. Free tiers often have low daily request limits, and polling every 15s is
  about 5,700 requests per day per match, so check the limits before choosing a provider.

### 5.5 Video provider adapter

All LiveKit calls go through a `VideoProvider` interface: `getPublishToken`, `endStream`, `getViewerToken`,
`createClip`, plus webhook handling for stream-started and stream-ended events. Only one implementation
(LiveKit) exists for now.

Track conventions for browser streams, so the player knows what each track is:

| Track | LiveKit source | Notes |
| --- | --- | --- |
| Match video | `screen_share` | Screen/tab share or local file. Publish at up to 1080p with simulcast so slow viewers get a lower layer. |
| Match audio | `screen_share_audio` | Tab audio or the file's audio |
| Facecam video | `camera` | 720p is enough |
| Creator voice | `microphone` | Echo cancellation on; creators should wear headphones so match audio doesn't loop into the mic |

Clips record the composited view (match + facecam in the creator's default layout) through LiveKit's room
composite egress.

---

## 6. Data model

```
users           id, name (unique), password_hash, role ('creator'|'viewer'), avatar_url, bio, created_at
sessions        token, user_id, created_at

channels        id, user_id (creator), display_name, banner_url, tags[], favourite_team,
                slow_mode_secs, subs_only, followers_only, created_at
follows         follower_id, channel_id, created_at

matches         id, external_id, sport, tournament, team_a, team_b, starts_at,
                status ('upcoming'|'live'|'completed'), score_json, updated_at
streams         id, channel_id, match_id, title, language, supporting_team, status
                ('starting'|'live'|'ended'), provider_ref, viewer_count, started_at, ended_at

chat_messages   id, stream_id, user_id, body, team_badge, deleted_by, created_at
reaction_totals stream_id, emoji, count            (periodic snapshot; live counts in memory)

polls           id, stream_id, question, options_json, status ('open'|'closed'), created_at
poll_votes      poll_id, user_id, option_index     (unique per poll+user)

clips           id, stream_id, created_by, title, start_offset, duration, url, created_at

sub_tiers       id, channel_id, name, display_price, perks, badge_url, rank
subscriptions   id, user_id, channel_id, tier_id, status ('active'|'cancelled'), created_at

moderators      channel_id, user_id
bans            channel_id, user_id, expires_at (null = permanent), reason, by_user_id
blocked_words   channel_id, word
mod_actions     id, channel_id, actor_id, target_user_id, action, details, created_at

notifications   id, user_id, type, payload_json, read, created_at
```

---

## 7. API surface

### REST

All paths are served under `/api` (the web app proxies it to the server).

| Method | Path | Purpose |
| --- | --- | --- |
| POST | `/auth/signup` | name, password, role → session |
| POST | `/auth/login` | name, password → session |
| GET | `/me` | current user |
| GET | `/matches?status=` | list matches (with live creator count and score) |
| GET | `/matches/:id` | match + live streams |
| GET | `/streams/live?match=&lang=&style=` | browse live streams (with viewer count) |
| GET | `/channels/:id` | channel page data |
| POST/DELETE | `/channels/:id/follow` | follow / unfollow |
| GET | `/me/following` | followed channels with their live stream, live first |
| POST | `/streams` | go live (returns a publish token) |
| POST | `/streams/:id/end` | end stream |
| GET | `/streams/:id` | stream + channel + match |
| GET | `/streams/:id/token` | viewer token (live streams only) |
| POST | `/streams/:id/clips` | create clip |
| GET | `/channels/:id/clips`, `/matches/:id/clips` | list clips |
| POST | `/streams/:id/polls`, `/polls/:id/close` | polls |
| GET/PUT | `/channels/:id/tiers` | subscription tiers + the caller's active sub (GET only in the prototype: tiers are seeded) |
| POST/DELETE | `/channels/:id/subscribe` | mock subscribe (`{ tierId }`, replaces any active sub) / cancel |
| GET | `/channels/:id/subscribers` | creator only |
| PUT | `/channels/:id/mod-settings` | slow mode, sub/follower-only, word list |
| POST/DELETE | `/channels/:id/moderators/:userId` | promote / demote |
| POST/DELETE | `/channels/:id/bans/:userId` | ban or timeout / unban (prototype: ban is the `mod:action` socket event; only DELETE exists) |
| GET | `/notifications` | list; mark read |
| GET | `/replay` | ReplayFeed status (prototype, no auth) |
| POST | `/replay/start`, `/replay/stop` | start (from ball 0, `{ speed }`) or stop the replay |

### WebSocket events

The socket authenticates with the session token in `handshake.auth.token`.

| Direction | Event | Payload |
| --- | --- | --- |
| C→S | `room:join` / `room:leave` | `streamId` |
| C→S | `chat:send` | `streamId, body, teamBadge` |
| S→C | `chat:history` | `streamId`, last 50 messages (sent to the joiner) |
| S→C | `chat:message` | `streamId`, message + user (`id`, `name`, `isCreator`, `isSub`) |
| S→C | `chat:deleted` | `streamId`, `messageIds` (one for a delete, all of a banned user's on the stream) |
| S→C | `chat:rejected` | `reason` (slow mode, banned, filtered…) |
| C→S | `reaction:batch` | `streamId`, `counts` `{ emoji: count }` |
| S→C | `reaction:burst` | `streamId`, this tick's counts per emoji, hype level 0–100 (taps in the last 5 s) |
| S→C | `poll:update` | `streamId`, poll (question, options, counts, total, status), `myVote` on messages to one user |
| C→S | `poll:vote` | `pollId, optionIndex` (first vote counts) |
| S→C | `score:update` | `matchId`, `score` (runs, wickets, overs, batters, bowler, last 6 balls) |
| S→C | `stream:status` | `streamId`, viewer count (sockets in the room minus the streamer) |
| S→C | `notify` | `{ type: 'live', stream }` to followers' `user:<id>` rooms when a creator goes live (every socket joins its user's room) |
| C→S | `mod:action` | `streamId` + `delete` (`messageId`) or `ban` (`userId`); timeout is cut for the prototype |

---

## 8. Open questions

1. **Web-first or mobile-first?** The design is mobile-first responsive web. Native apps come later.
2. **Cricket data API:** which provider for `ApiFeed`, and does its free tier cover the live-score polling rate we
   need? (Not blocking: the ReplayFeed covers development and demos.)
3. **Launch moment:** test around a specific tournament so match pages have real fixtures?
4. **Creator/viewer split:** can a viewer later upgrade to creator, or is the role fixed at signup?
5. **Broadcast rights before a public launch:** private testing with older matches is fine, but publicly streaming
   match footage needs a plan (licensed content, rights-holder deals, or a takedown process). Needs a lawyer before
   launch.
