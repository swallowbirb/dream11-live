# M2 Cricket + hype: phase plan

Module 2 from [`plan.md`](../plan.md) §4, broken into phases. One phase per chat. Budget ~1.5h total.

**Module done when:** start a replay, two creators stream the same match, the match page shows both, the score
ticks on the player, reactions float and a poll runs end to end.

Rules for every phase: happy path only, typecheck is the check, no tests, commit at the end of each phase.
Anything new goes to `plan.md` §8. Verify headless (Playwright from `spike/node_modules`, or a node script with
`socket.io-client` for server-only work), as in M1.

## Status (update at the end of every phase)

**Module 2 is done (2026-11-15). Next up: Module 3 (Creator extras + polish).** Its phase file `plans/m3-creator-polish.md` doesn't exist yet: the next chat writes it from `plan.md` §4 Module 3 (same format as this file), then does its P1.

| Phase | Status | Handoff notes |
| --- | --- | --- |
| P1 ReplayFeed + matches | done (2026-11-15) | Shared: `Score` (batting/bowling, runs, wickets, overs `"6.0"`, `batters` [striker first, `onStrike`], `bowler`, `recent` last 6 tokens, `finished`), `BatterLine`, `BowlerLine`, `ScoreUpdate` `{ matchId, score }`; `MatchSummary.score` is `Score \| null` (`parseScore` in `src/streams.ts` returns null for `"{}"` or old seed shapes). Server: `src/feed/feed.ts` (`MatchFeed`, `FeedStatus`, `OnScore`), `src/feed/replay.ts` (`ReplayFeed` + `Innings` scoring: odd runs and end of over swap strike, `W` brings the next batter in on strike, `wd`/`nb` +1 and not legal), `src/feed/routes.ts` (`GET /api/replay`, `POST /api/replay/start {speed}`, `POST /api/replay/stop`; fans `score:update` out to rooms of live streams on the match). `roomOf` is now exported from `src/realtime.ts`. Data: `apps/server/replays/ind-aus.json` (6 overs, 38 deliveries, ends 63/3), matched to the seed by `externalId`. Start writes the 0/0 score and sets the match `live`; the last ball sets `completed`. Feed state is in memory: a server restart (incl. `tsx watch` reloads) stops the replay, and the DB keeps the last score. Seed now writes `scoreJson: '{}'`. Verified headless (node + socket.io-client): a viewer socket in a live IND vs AUS stream got all 39 updates (start + 38 balls), final 63/3 (6.0) as computed by hand, `GET /api/matches` shows it `completed`, ENG vs NZ untouched, stop mid-innings stays stopped. Not done here: no match socket room (P2 refetches), the player doesn't show the score yet (P2). |
| P2 Browse pages + scorecard | done (2026-11-15) | Server (`src/streams.ts`): `GET /api/matches` now returns `MatchListItem[]` (adds `liveCount`), `GET /api/matches/:id` → `{ match, streams }`, `GET /api/streams/live?match=` → `{ streams: LiveStream[] }` (`StreamInfo` + `viewerCount`, sorted by viewers). `viewerCount(streamId, ownerUserId)` in `src/realtime.ts` reads the socket room (same rule as `stream:status`). Web: `components/browse/` (`MatchStatus` chip + `scoreLine`, `MatchCard`, `StreamCard` + `StreamGridSkeleton`; stream thumbnails are a flag gradient, no video frames), `components/player/Scorecard.tsx` (strip: score with tick animation, batters with `*` on strike, bowler figures, last-6 ball chips coloured W/boundary/extra). `pages/Home.tsx` holds `HomePage`, `MatchesPage` (all matches grouped Live/Upcoming/Completed, no tabs) and shared `useMatches`, `Section`, `EmptyState`, `BROWSE_REFRESH_MS` (5 s polling for scores and counts); `pages/Match.tsx` (red header with score + creator grid, designed empty state). `useStreamRoom` returns `score` from `score:update`; Watch shows `room.score ?? stream.match.score` (strip only while live). Verified headless (Playwright): Rohit live through the dashboard (file + fake cam) and AussieAnalyst via API on IND vs AUS with a replay at 15×: home shows the live match card ("2 creators live") and both stream cards, the match page lists both, opening Rohit's card plays both videos and the strip went 0/0 (0.0) → 5/0 (0.4) in 6.5 s; after both ended the match lists 0 streams. Phone width checked. Headless helpers (`lib.mjs`: login, `goLiveUI`) are in scratch, not the repo. The dashboard's "Viewer link" stays. |
| P3 Reactions | done (2026-11-15) | Shared: `REACTIONS` (🔥 😱 👏 🏏 😂 💔), `Reaction`, `ReactionCounts`, Zod `ReactionBatch` `{ streamId, counts }` (1–50 per emoji), `ReactionBurst` `{ streamId, counts, hype }`. Server (`src/realtime.ts`): `reaction:batch` (sender must be in the room) adds to a per-stream in-memory `pending`; a 250 ms interval flushes `reaction:burst` to each room with taps or hype, hype = taps in the last 5 s (20 ticks) × 4, capped at 100; the stream is dropped from the map after the burst that reaches 0. Web: `hooks/useReactions.ts` (batches taps every 250 ms; own taps float at once and their server echo is subtracted from the next burst so they aren't shown twice), `components/player/Reactions.tsx` (`ReactionOverlay` with Motion floaters, `EmojiTray`, `HypeMeter`). `LivePlayer` gained an `overlay` prop (drawn over the frame, no pointer events). Watch: tray + hype meter row between the player controls and the scorecard. Dashboard: hype meter next to the viewer count (no floaters on the preview). Verified headless: creator + 2 viewers; 10 🔥 taps from one viewer → the other sees 10 floaters, the tapper sees 10 (not 20), hype 40 on both viewers and the dashboard, back to 0 and no floaters after 5 s idle. |
| P4 Polls | done (2026-11-15) | Shared: Zod `PollCreate` (question + 2–4 options), `PollVoteBody`, `PollState` (options, counts, total, status), `PollUpdate` `{ streamId, poll, myVote? }` (`myVote` only on messages to one user). Server: `src/polls.ts` (`POST /api/streams/:id/polls` creator + live only, closes any open poll first; `POST /api/polls/:id/close`; `poll:vote` socket handler, one vote per user via the `poll_votes` key, later votes ignored; `pollJoin` sends the open poll + the joiner's vote on `room:join`). Counts come from a `groupBy` on every update (fine at prototype scale). `roomOf` moved to `src/rooms.ts` (re-exported from `realtime.ts`) to avoid a cycle. Web: `hooks/usePoll.ts` (poll + per-poll `myVote`), `components/poll/PollCard.tsx` (`PollCard` vote buttons → result bars; `PollResults`, winner green once closed; closed card can be dismissed), `components/poll/PollControls.tsx` (dashboard form, live counts, Close). Watch shows the card in the player overlay from `sm` up and inline under the tray on phones. Verified headless: creator + 3 viewers; votes update everyone live (50/0/50 → 67/0/33), a late joiner gets the open poll, a reload keeps the vote (no buttons), Close shows "Final result" everywhere and the creator's form comes back. |

---

## P1. ReplayFeed + matches (S1, 25 min)

Server only, plus the shared types. No UI (P2 shows the score).

- Shared: a `Score` type (batting/bowling team, runs, wickets, overs as `"12.3"`, the two batters with runs and
  balls and who's on strike, the current bowler's figures, the last 6 balls, finished flag). `MatchSummary` gains
  `score: Score | null` (parsed from `matches.scoreJson`). `ScoreUpdate` payload for `score:update`:
  `{ matchId, score }`.
- `src/feed/feed.ts`: the `MatchFeed` interface (start, stop, status). `src/feed/replay.ts`: `ReplayFeed` reads a
  hand-written JSON innings and plays it ball by ball at a set speed (speed × real time, real time ≈ 30 s a
  ball; default 10× = 3 s a ball). Each ball: compute the new score, upsert `matches` (`scoreJson`, status `live`,
  `completed` after the last ball), emit `score:update` to every live stream room linked to the match.
- One replay file: IND batting vs AUS, a few overs, compact ball tokens (`.`, `1`–`6`, `W`, `wd`, `nb`). Linked
  to the seeded IND vs AUS match by `externalId`.
- Start/stop: `POST /api/replay/start { speed? }`, `POST /api/replay/stop`, `GET /api/replay` (no auth: local
  prototype). A `pnpm replay [start [speed] | stop]` script calls them. Start restarts the innings from ball 0.

**Done when:** with a stream live on IND vs AUS, `pnpm replay start` makes a socket in that stream's room receive
`score:update` every ball, `GET /api/matches` shows the current score, and the match ends `completed`.

---

## P2. Browse pages + scorecard strip (S2, 30 min)

- Server: `GET /api/matches/:id` (match + its live streams), `GET /api/streams/live?match=` (live streams with
  channel and match). Live creator count per match on `GET /api/matches`.
- Cards: `MatchCard` (Team A vs Team B with flags, status chip `● LIVE` / `Starts in 2h` / `Completed`, mini
  score, "N creators live") and `StreamCard` (thumbnail placeholder with LIVE pill and viewer count, creator
  name, title, language chip). LIVE pill from M1.
- Home (`/`): live matches row, then live streams grid, then upcoming matches. Match page (`/matches/:id`):
  header with teams, score and status, then the grid of creators streaming it. Designed empty state.
- Scorecard strip on the player (`/watch/:id`): score, overs, batters (striker marked), bowler, last 6 balls as
  chips. Starts from the stream's `match.score`, then follows `score:update` through `useStreamRoom`.
- Home and match page refetch every ~5 s for scores and creator counts (no match socket room).
- Remove the temporary "Viewer link" from the dashboard only if it's in the way (it's harmless).

**Done when:** with a replay running and two creators live on IND vs AUS, home and the match page list both
streams, a viewer opens one from the card, and the strip ticks with each ball.

---

## P3. Reactions + hype meter (S3 part 1, 15 min)

- Shared: `ReactionBatch` (`{ streamId, counts: { emoji: n } }`), `ReactionBurst` (`{ streamId, counts, hype }`),
  the emoji list 🔥 😱 👏 🏏 😂 💔.
- Server: in-memory counter per stream; `reaction:batch` adds to it; every 250 ms, rooms with taps get
  `reaction:burst` with that tick's counts and a hype level (rolling average of the last few seconds, 0–100).
- Web: emoji tray under the player; taps batched client-side and sent at most every 250 ms; each tap (own and
  others', capped per burst) floats up over the video and fades (Motion). Hype meter bar on the player and the
  dashboard.

**Done when:** two viewers tap 🔥 and both see the emojis float, and the hype meter rises and decays.

---

## P4. Polls (S3 part 2, 15 min)

- Server: `POST /api/streams/:id/polls` (creator: question + 2–4 options; closes any open poll),
  `POST /api/polls/:id/close`. Votes over `poll:vote`, one per user (`poll_votes` unique). `poll:update` (poll +
  counts + open/closed) to the room on start, every vote and close; the joiner gets the open poll on
  `room:join`.
- Web: dashboard poll form (question + options) and a Close button with live counts. Player overlay card:
  options as buttons, then bars with percentages after voting or once closed.

**Done when:** the creator starts a poll, two viewers vote, all three see the counts update live, the creator
closes it and the overlay shows the final result.

---

## Module close (5 min)

- [x] Module "done when" covered by the phase checks on the final code (P2: replay + two creators on the match page + ticking strip; P3: reactions; P4: poll end to end). No separate combined run.
- [x] `plan.md` §9: M2 steps marked done. Nothing was cut.

## Phase timing

| Phase | Step | Time |
| --- | --- | --- |
| P1 | S1 ReplayFeed + matches | 25 |
| P2 | S2 browse pages + scorecard strip | 30 |
| P3 | S3 reactions + hype meter | 15 |
| P4 | S3 polls | 15 |
| | **Total** | **~1.5h** |

If behind at P4: cut polls (`plan.md` §7 item 5) and close the module after P3.
