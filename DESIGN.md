# Cricket Live Reaction Platform: Design Doc

**Status:** Draft v1 · 2026-11-15
**Scope:** Prototype

> One line: a platform where cricket creators react live, and fans watch, chat and share the excitement together.

---

## 1. Overview

A live-streaming platform for cricket, modelled on Twitch. Creators stream their own camera and commentary while
a match is on. Viewers join, watch, chat and send instant emoji reactions, and the creator responds live.

The core mechanics (channels, going live, following, chat, clips, subscriptions) work like Twitch. On top of that
the platform adds cricket-specific features: match pages, team badges, a live scorecard and polls.

Creators stream only their own camera and commentary. Match footage and audio are not part of the product.

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
- **Stream key** for OBS (RTMP) and **browser go-live** (camera + mic straight from the page) for creators without OBS.
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
- No attempt to sync the stream with the TV broadcast.

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
8. **Creator dashboard:** go-live setup (stream key / browser), preview, chat with mod actions, viewer count, hype
   meter, poll controls, mod settings (slow mode, word filter, mods list), subscriber list, tier editor.
9. **Subscribe modal:** tier cards and a mock checkout confirmation.
10. **Clip viewer:** clip player, title, creator, linked match, share button.

---

## 5. Architecture

### 5.1 Recommended stack (not final)

| Piece | Recommendation | Why |
| --- | --- | --- |
| Frontend | Next.js (React) + Tailwind CSS + Framer Motion | Fast to build a polished UI, good animation tooling |
| Backend API | Node.js (Fastify or NestJS) | Same language as the frontend, good WebSocket support |
| Realtime | Socket.IO | Rooms per stream, reconnection built in |
| Database | PostgreSQL (or SQLite to start) | Relational data with simple joins |
| Pub/sub + counters | Redis (optional for the prototype; in-memory works with one server) | Chat fan-out and reaction counters |
| Video | **LiveKit** (browser go-live + RTMP ingress + recording/egress) or **Mux** / **AWS IVS** | Don't build video infrastructure |
| Match data | A cricket data API (e.g. CricketData.org, Roanuz, Sportmonks) | Fixtures and live scores |

### 5.2 System sketch

```
 Browser (viewer/creator)
   │  HTTPS (REST)          WebSocket (chat, reactions, polls, notifications)
   ▼                         ▼
 ┌──────────────────────────────────────┐
 │            Backend (Node)            │
 │  REST API · Socket.IO rooms · jobs   │
 └──────┬──────────────┬────────────────┘
        │              │
   PostgreSQL       Redis (optional)
        │
   Video provider  ◄── OBS (RTMP) / browser (WebRTC)
   (ingest, playback, recording for clips)
        ▲
   Match-data poller ── cricket data API (every 10–30s for live matches)
```

### 5.3 Key flows

**Go live**
1. The creator fills in the go-live form and the backend creates a `stream` row (status `starting`).
2. The backend asks the video provider for an ingest (RTMP URL + key, or a WebRTC token) and returns it.
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
1. A background job fetches fixtures daily and live scores every 10–30s for live matches.
2. It upserts `matches` and broadcasts `score:update` to every stream room linked to that match.

---

## 6. Data model

```
users           id, name (unique), password_hash, role ('creator'|'viewer'), avatar_url, bio, created_at
sessions        token, user_id, created_at

channels        id, user_id (creator), display_name, banner_url, tags[], favourite_team,
                stream_key, slow_mode_secs, subs_only, followers_only, created_at
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

| Method | Path | Purpose |
| --- | --- | --- |
| POST | `/auth/signup` | name, password, role → session |
| POST | `/auth/login` | name, password → session |
| GET | `/me` | current user |
| GET | `/matches?status=` | list matches |
| GET | `/matches/:id` | match + live streams |
| GET | `/streams/live?match=&lang=&style=` | browse live streams |
| GET | `/channels/:id` | channel page data |
| POST/DELETE | `/channels/:id/follow` | follow / unfollow |
| GET | `/me/following` | followed channels |
| POST | `/streams` | go live (returns ingest info) |
| POST | `/streams/:id/end` | end stream |
| POST | `/streams/:id/clips` | create clip |
| GET | `/channels/:id/clips`, `/matches/:id/clips` | list clips |
| POST | `/streams/:id/polls`, `/polls/:id/close` | polls |
| GET/PUT | `/channels/:id/tiers` | subscription tiers |
| POST/DELETE | `/channels/:id/subscribe` | mock subscribe / cancel |
| GET | `/channels/:id/subscribers` | creator only |
| PUT | `/channels/:id/mod-settings` | slow mode, sub/follower-only, word list |
| POST/DELETE | `/channels/:id/moderators/:userId` | promote / demote |
| POST/DELETE | `/channels/:id/bans/:userId` | ban or timeout / unban |
| GET | `/notifications` | list; mark read |

### WebSocket events

| Direction | Event | Payload |
| --- | --- | --- |
| C→S | `room:join` / `room:leave` | `streamId` |
| C→S | `chat:send` | `body, teamBadge` |
| S→C | `chat:message` | message + user badges |
| S→C | `chat:deleted` | `messageId` |
| S→C | `chat:rejected` | `reason` (slow mode, banned, filtered…) |
| C→S | `reaction:batch` | `{ emoji: count }` |
| S→C | `reaction:burst` | totals per emoji + hype level |
| S→C | `poll:update` | poll state + counts |
| C→S | `poll:vote` | `pollId, optionIndex` |
| S→C | `score:update` | match score |
| S→C | `stream:status` | live / ended, viewer count |
| S→C | `notify` | go-live and other notifications |
| C→S | `mod:action` | delete / timeout / ban, target |

---

## 8. Open questions

1. **Web-first or mobile-first?** The design is mobile-first responsive web. Native apps come later.
2. **Video provider:** LiveKit (self-hostable, free tier, browser + RTMP) vs Mux / AWS IVS (simpler, paid).
3. **Cricket data API:** which provider, and does its free tier cover the live-score polling rate we need?
4. **Launch moment:** test around a specific tournament so match pages have real fixtures?
5. **Creator/viewer split:** can a viewer later upgrade to creator, or is the role fixed at signup?
