# M2 Cricket + hype: phase plan

Module 2 from [`plan.md`](../plan.md) §4, broken into phases. One phase per chat. Budget ~1.5h total.

**Module done when:** start a replay, two creators stream the same match, the match page shows both, the score
ticks on the player, reactions float and a poll runs end to end.

Rules for every phase: happy path only, typecheck is the check, no tests, commit at the end of each phase.
Anything new goes to `plan.md` §8. Verify headless (Playwright from `spike/node_modules`, or a node script with
`socket.io-client` for server-only work), as in M1.

## Status (update at the end of every phase)

**Next up: P1 ReplayFeed + matches.**

| Phase | Status | Handoff notes |
| --- | --- | --- |
| P1 ReplayFeed + matches | not started | |
| P2 Browse pages + scorecard | not started | |
| P3 Reactions | not started | |
| P4 Polls | not started | |

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

- [ ] Click-through of the module's "done when" headless (replay + two creators + viewers).
- [ ] `plan.md` §9: M2 steps marked done; anything cut noted in §7.

## Phase timing

| Phase | Step | Time |
| --- | --- | --- |
| P1 | S1 ReplayFeed + matches | 25 |
| P2 | S2 browse pages + scorecard strip | 30 |
| P3 | S3 reactions + hype meter | 15 |
| P4 | S3 polls | 15 |
| | **Total** | **~1.5h** |

If behind at P4: cut polls (`plan.md` §7 item 5) and close the module after P3.
