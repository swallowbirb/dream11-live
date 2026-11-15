# Cricket Live Reaction Platform: Master Plan

High level: what to build, in what order, and what to cut. Not how. Each step gets broken into phases (one
chat each) when its turn comes, in its own file under `plans/` (for example `plans/m1-s2-auth.md`).

Design: [`DESIGN.md`](DESIGN.md). Where this plan cuts something DESIGN.md lists under "Build now", **this plan
wins for the prototype**; the cut items are in section 7, not deleted from the design.

---

## 1. The one rule: speed over perfection

**Budget: 4 to 5 hours total.** It's a prototype. A working, good-looking demo of the core loop beats a
complete feature list that doesn't run.

- **Ship the happy path.** No edge-case handling, no retries, no error states beyond a toast. If it works when
  used normally in a demo, it's done.
- **Timebox every step.** When a step hits its time, stop, cut what's left (section 7), move on. Never extend
  a step by borrowing from a later module.
- **No new scope mid-build.** Any idea that comes up goes into section 8 ("Parking lot") and is not built.
- **Hardcode and seed.** Seed data, fixed constants and in-memory state beat settings screens and editors.
- **Tests:** none, except a quick manual click-through at the end of each module. Typecheck is the check.
- **Copy, don't invent.** shadcn/ui components, LiveKit React components and Tailwind defaults as they come.
  Only restyle with the Dream11 tokens.
- **Looks matter, but late.** Set up the colour tokens and fonts in step 1 so everything is on-brand from the
  start, then spend the polish time in Module 3, not along the way.

## 2. Locked decisions

From DESIGN.md §5.1, with these prototype shortcuts:

- pnpm monorepo: `apps/web` (Vite + React + TS + Tailwind + shadcn), `apps/server` (Fastify + Socket.IO +
  Prisma), `packages/shared` (event names, payload types, Zod schemas).
- **SQLite** via Prisma for the whole build (DESIGN allows it for local dev). Switching to Postgres for a deploy
  is a one-line provider change.
- **Runs locally.** Deploying to Vercel + Railway is a stretch step at the very end (M3 S4), cut first if late.
- **LiveKit Cloud** for video, behind the `VideoProvider` interface (just `getPublishToken`, `getViewerToken`;
  webhooks replaced by the client telling the server "I'm live" / "I ended").
- **ReplayFeed only** for match data, from one or two hand-written JSON files. No cricket API.
- **Auth:** name + password (bcrypt) + role, session token in `localStorage`. Nothing else.
- **Go-live sources:** local video file (`captureStream()`) and camera + mic. Screen/tab share is a cheap add
  (same publish path) if time allows.
- In-memory state for reactions, poll tallies and timeouts. No Redis.

## 3. What gets built (the prototype cut)

| Area | In the 5 hours | Cut (section 7) |
| --- | --- | --- |
| Auth | Signup / login with role | Profile editing |
| Channels | Channel page (avatar, bio, tags, live player or offline card), follow / unfollow | Banner upload, clips row |
| Going live | Go-live form (title, match, team, language), file + camera publish as separate tracks, end stream | Screen share (stretch), file seek controls beyond play/pause |
| Matches | Home (live matches, live streams), match page with creator grid, ReplayFeed scores | Matches tabs + tournament filter, language/style filters |
| Watching | Player with PiP facecam, layout toggle (PiP / side by side), two volume sliders, scorecard strip | Resizable PiP, theatre mode, per-creator default layout |
| Chat | Real-time chat, team badge, role badges | Emote picker |
| Reactions | Emoji tray, floating bursts, hype meter | Reaction snapshots to DB |
| Polls | Start, vote once, live results, close | Poll history |
| Notifications | Go-live toast to online followers | Bell, stored notification list |
| Subscriptions | 3 seeded tiers, subscribe modal, sub badge in chat | Tier editor, sub-only mode, subscriber list |
| Moderation | Delete message, ban (permanent) | Mods, timeouts, slow mode, follower-only, word filter, mod log |
| Clips | — | Whole feature (needs Egress) |
| Following page | Live first, then offline | — |

## 4. The three modules

```
M1 Live core (~2h)  ->  M2 Cricket + hype (~1.5h)  ->  M3 Creator extras + polish (~1–1.5h)
```

Each module ends with something demoable. If the clock runs out after M1 or M2, what exists still works.

### Module 1: Live core (~2h)

**Goal:** a creator goes live with a video file and a facecam; a viewer opens the stream, sees both, and they
chat. This is the riskiest module (LiveKit), so it goes first.

| Step | What | Time |
| --- | --- | --- |
| **S0. LiveKit spike** | Before anything else: a throwaway page that publishes a local file (`captureStream()`) as `screen_share` + `screen_share_audio` and a camera as `camera` + `microphone`, and a second tab that subscribes to both. Confirms keys, track sources and file audio. **If it fails after 20 min:** drop to a single combined track and note it. | 20 min |
| **S1. Scaffold** | pnpm monorepo, Vite app with Tailwind + shadcn + Dream11 tokens + fonts, Fastify + Socket.IO server, Prisma (SQLite) with the full schema from DESIGN §6 in one go (cheaper than migrating later), shared package. Fill in the Commands section of `CLAUDE.md`. | 25 min |
| **S2. Auth + shell** | Signup / login (role cards), session middleware, app shell (red header, mobile bottom tabs, routes as empty pages). Seed script: 3 creators, 3 viewers, 2 matches. | 20 min |
| **S3. Go live + watch** | `POST /streams` (publish token), `POST /streams/:id/end`, viewer token. Creator dashboard: form, source pickers, preview, Go live / End. Player page: match video full size + draggable PiP facecam, layout toggle, two volume sliders. | 40 min |
| **S4. Chat** | Socket rooms per stream, `chat:send` → save → `chat:message`, chat panel on player and dashboard, team badge picker, creator badge. Viewer count from room size. | 15 min |

**Done when:** two browsers (creator + viewer accounts) can do the full go-live → watch → chat loop locally.

### Module 2: Cricket + hype (~1.5h)

**Goal:** it feels like *cricket* Twitch: matches as hubs, a live score on the player, reactions flying.

| Step | What | Time |
| --- | --- | --- |
| **S1. ReplayFeed + matches** | `MatchFeed` interface, `ReplayFeed` reading a JSON match ball by ball at a set speed, started by a script/endpoint. Upserts `matches`, broadcasts `score:update` to linked stream rooms. One hand-written short innings file (a few overs is enough). | 25 min |
| **S2. Browse pages** | Home (live matches + creator counts, live streams), match page (header + score + creator grid), match and creator cards with LIVE pill. Scorecard strip on the player (score, overs, batters/bowler, last 6 balls). | 30 min |
| **S3. Reactions + polls** | Emoji tray, client batching (250 ms), server counters and `reaction:burst` flush, floating bursts (Framer Motion), hype meter. Polls: creator starts/closes from dashboard, viewers vote once, live results overlay. | 30 min |

**Done when:** start a replay, two creators stream the same match, the match page shows both, the score ticks
on the player, reactions float and a poll runs end to end.

### Module 3: Creator extras + polish (~1–1.5h)

**Goal:** the social bits that make it a platform, then make it look shipped. S3 is the step most worth
protecting; S1 and S2 shrink first.

| Step | What | Time |
| --- | --- | --- |
| **S1. Follow + notify** | Follow / unfollow, channel page, Following page (live first). On go-live, emit `notify` to online followers → toast. | 20 min |
| **S2. Subs + mod (thin)** | Seeded tiers, subscribe modal (checkout-style), sub badge in chat. Creator/mod: delete message, ban. | 20 min |
| **S3. Polish pass** | Skeleton loaders, designed empty states, LIVE pill pulse, score tick animation, button press feedback, mobile layout check (chat under player). Fix whatever looks worst in a click-through. | 30 min |
| **S4. Deploy (stretch)** | Postgres provider switch, server to Railway, web to Vercel. Cut without regret if late. | 20 min |

**Done when:** the demo script below runs cleanly on desktop and looks good on a phone width.

## 5. Demo script (the acceptance test)

1. Sign up a creator and a viewer (two browsers).
2. Viewer follows the creator.
3. Start the replay of the seeded match.
4. Creator goes live on that match with a match file + facecam. Viewer gets a toast.
5. Viewer opens the match page, sees the creator, opens the stream.
6. Viewer switches layout, turns match audio down, chats with a team badge, spams 🔥.
7. Creator runs a poll; viewer votes; results update.
8. Viewer subscribes; badge shows in chat. Creator deletes a message.
9. Creator ends the stream; it leaves the match page.

## 6. Risks (check early, have a fallback)

| Risk | Check in | Fallback |
| --- | --- | --- |
| LiveKit two-track publish or file audio doesn't work | M1 S0 | One combined track; drop layouts and audio mix |
| LiveKit Cloud account/keys not ready | Before M1 | User creates a free project and puts keys in `apps/server/.env` before starting |
| Running behind | End of each step | Cut in the order in section 7 |

## 7. Cut list, in the order to cut if behind

Cut from the bottom of the current module first, never steal from a later module's must-haves.

1. Deploy (M3 S4)
2. Moderation (M3 S2, second half)
3. Subscriptions (M3 S2, first half)
4. Following page (keep follow button + toast)
5. Polls (M2 S3, second half)
6. Layout toggle (keep PiP only)

**Already cut for the prototype** (DESIGN.md §3.1 items deferred to after the 5 hours): clips, screen/tab
share (unless spare time), mod roles, timeouts, slow mode, follower-only and sub-only modes, word filter, mod
log, tier editor, subscriber list, notification bell and history, resizable PiP, theatre mode, matches tabs and
filters, emote picker, dark mode. Plus everything in DESIGN.md §3.2 to §3.4.

## 8. Parking lot

New ideas that come up during the build go here, unbuilt.

-

## 9. Progress

| Module | Step | Status |
| --- | --- | --- |
| M1 | S0 LiveKit spike | done: two-track publish + file audio work on LiveKit Cloud |
| M1 | S1 Scaffold | done: monorepo, both apps, full schema, Dream11 tokens |
| M1 | S2 Auth + shell | done: signup/login/logout, shell, seed |
| M1 | S3 Go live + watch | not started |
| M1 | S4 Chat | not started |
| M2 | S1 ReplayFeed + matches | not started |
| M2 | S2 Browse pages | not started |
| M2 | S3 Reactions + polls | not started |
| M3 | S1 Follow + notify | not started |
| M3 | S2 Subs + mod (thin) | not started |
| M3 | S3 Polish pass | not started |
| M3 | S4 Deploy (stretch) | not started |
