# M3 Creator extras + polish: phase plan

Module 3 from [`plan.md`](../plan.md) §4, broken into phases. One phase per chat. Budget ~1–1.5h total. P4 (polish)
is the phase most worth protecting: P1–P3 shrink first. P5 (deploy) is an optional stretch, outward-facing (Railway,
Vercel, accounts, secrets): only with the user's go-ahead.

**Module done when:** the demo script (`plan.md` §5) runs cleanly on desktop and looks good on a phone width.

Rules for every phase: happy path only, typecheck is the check, no tests, commit at the end of each phase.
Anything new goes to `plan.md` §8. Verify headless (Playwright from `spike/node_modules`, Chromium with a fake
camera and mic, one browser context per user), as in M1/M2, and look at the screenshots.

## Status (update at the end of every phase)

**Next up: P3 Moderation.**

| Phase | Status | Handoff notes |
| --- | --- | --- |
| P1 Follow + notify | done (2026-11-15) | Shared: `ChannelInfo` (display name, bio from `users.bio`, tags, favourite team, `followerCount`, `following` for the caller, `live: LiveStream \| null`), `Notify` `{ type: 'live', stream }`. Server: `src/channels.ts` (`GET /api/channels/:id`, `POST`/`DELETE /api/channels/:id/follow` (can't follow yourself), `GET /api/me/following` → `{ channels }` live first by viewers, then by name); `streams.ts` exports `withRefs` and `toLive`; `realtime.ts` puts every socket in `user:<id>` and exports `notifyFollowers(channelId, payload)`, called by `POST /api/streams`. Web: `components/channel/FollowButton.tsx` (optimistic, hidden on your own channel, invalidates `['channel', id]` and `['following']`), `components/channel/ChannelRow.tsx`, `pages/Channel.tsx` (`ChannelPage`, `useChannel` (5 s refetch), banner gradient, live `StreamCard` or offline card, skeleton; on phones the follow button gets its own row), `pages/Following.tsx` (Live · N, then Offline, designed empty state), `hooks/useNotify.ts` (called in `AppShell`: opens the socket at login so the user counts as online, toast with a Watch action). Watch: follow button on the creator bar. `pages/Placeholder.tsx` removed (no placeholders left). Verified headless: priya follows Rohit on his channel (0 → 1 follower), waits on /matches, Rohit goes live from the dashboard, priya gets the toast and Watch opens the stream (both videos), /following shows him under Live, then offline after End. Phone width checked. |
| P2 Subscriptions | done (2026-11-15) | Shared: `SubTierInfo`, `TiersResponse` `{ tiers, mySub: { tierId, since } \| null }`, Zod `SubscribeBody`; `ChatMessage.user` is now `{ id, name, isCreator, isSub }` (`id` is there for P3's ban). Server: `src/tiers.ts` (`DEFAULT_TIERS`: Fan ₹59, Superfan ₹149, Legend ₹299; used by the seed for channels with no tiers and by creator signup), `src/subs.ts` (`GET /api/channels/:id/tiers`, `POST /api/channels/:id/subscribe { tierId }` cancels any active sub then creates one, `DELETE` cancels; can't sub to yourself). `realtime.ts`: the owner cache now holds `{ userId, channelId }` (`streamRefs`), `subscriberIds(streamId, userIds)` sets `isSub` on history and on each message (one query each, no cache, so a new sub shows at once; history shows the *current* sub status, like Twitch). Web: `components/channel/Subscribe.tsx` (`SubscribeButton` → dialog: tier cards → checkout summary with a "mock checkout, no payment" note → spring check "You're a Legend!"; subscribed users see "Subscribed · Tier" and can change tier or cancel; `SubBadge`, gold, used in chat). Buttons on the Watch creator bar (own row, full width on phones) and the channel page. shadcn `DialogContent` now `bg-surface rounded-2xl` (it was the grey page bg). Re-run `pnpm db:seed` on an existing DB to get the tiers. Verified headless: priya subscribes (Legend) from the player, button shows "Subscribed · Legend", arjun sees `SUB` on her next message live and on both after a reload; phone dialog and creator bar checked. |
| P3 Moderation | not started | |
| P4 Polish pass | not started | |
| P5 Deploy (optional) | not started | Stretch, outward-facing: needs the user's go-ahead and accounts. |

---

## P1. Follow + notify (S1, 20 min)

- Server: `GET /api/channels/:id` (channel: display name, bio, tags, favourite team, follower count, `following`
  for the caller, live stream if any), `POST` / `DELETE /api/channels/:id/follow`, `GET /api/me/following`
  (followed channels with their live stream, live first).
- Go live (`POST /api/streams`) emits `notify` `{ type: 'live', stream }` to every online follower. Each socket
  joins a `user:<id>` room on connect, so "online" = has a socket.
- Web: `FollowButton` (optimistic toggle), channel page `/c/:channelId` (avatar, bio, tags, follower count, live
  stream card or a designed offline card), Following page `/following` (live first, then offline), follow button
  on the player's creator bar. A global `notify` listener in the shell shows a toast with a "Watch" action.

**Done when:** a viewer follows a creator from the channel page, the creator goes live, the viewer (on another
page) gets a toast that opens the stream, and `/following` lists the creator as live.

---

## P2. Subscriptions (S2 part 1, 10 min)

- Seed: 3 tiers per creator channel (e.g. Fan ₹59, Superfan ₹149, Legend ₹299, perks text), upserted.
- Server: `GET /api/channels/:id/tiers` (tiers + the caller's active sub), `POST /api/channels/:id/subscribe
  { tierId }` (one active sub per user and channel; changing tier replaces it), `DELETE` to cancel.
  `ChatMessage.user` gains `isSub` (active sub on the stream's channel), cached per stream like the owner.
- Web: `SubscribeDialog` (tier cards, then a checkout-style confirm step: "Mock checkout, no payment"), a
  Subscribe / Subscribed button on the player bar and the channel page, gold SUB badge in chat.

**Done when:** a viewer subscribes from the player, the button shows Subscribed, and their next chat message has
the SUB badge for everyone.

---

## P3. Moderation (S2 part 2, 10 min)

- Server: `mod:action` `{ streamId, action: 'delete' | 'ban', messageId? , userId? }`, from the stream's creator
  only. Delete sets `deletedBy` and emits `chat:deleted` `{ streamId, messageId }`. Ban upserts `bans` (permanent),
  marks that user's messages on the stream deleted (one `chat:deleted` each), and `chat:send` from a banned user
  gets `chat:rejected` ("You are banned from this chat"). `ChatMessage.user` gains `id` so the creator can ban.
- Web: on the dashboard chat, hovering a line shows Delete and Ban buttons (not on the creator's own lines).
  Deleted lines disappear for everyone.

**Done when:** the creator deletes a viewer's message and it's gone for everyone; after a ban, the viewer's next
message is rejected with a toast.

---

## P4. Polish pass (S3, 30 min)

- Skeleton loaders where pages still show a bare pulse block or nothing (Watch, channel, following, profile).
- Designed empty states everywhere (following empty, channel offline, no matches).
- LIVE pill pulse (a ring, not only the dot), score tick animation on the strip and the match header, button press
  feedback (`active:scale` on the shadcn button).
- Profile page made useful (role, channel link, following count, log out on mobile where there's no header menu).
- Mobile check at 390 px: player, chat under the player, dashboard, home, match page, channel page.
- A click-through of the demo script (`plan.md` §5) headless, with screenshots: fix whatever looks worst.

**Done when:** the demo script runs headless end to end and the desktop and phone screenshots look shipped.

---

## P5. Deploy (S4, optional stretch, 20 min)

Outward-facing (accounts, secrets, public URLs): don't start it without the user's go-ahead.

- Prisma provider to Postgres (Railway Postgres), migrate, seed.
- Server to Railway (long-running, for WebSockets), env: `DATABASE_URL`, LiveKit keys, `PORT`.
- Web to Vercel (static SPA) with `/api` and `/socket.io` pointed at the Railway URL (rewrites, or a
  `VITE_API_URL` + socket URL).

**Done when:** the demo script runs on the public URLs.

---

## Module close (5 min)

- [ ] Module "done when" covered by P4's demo-script run on the final code (desktop + phone width).
- [ ] `plan.md` §9: M3 steps marked done (S4 deploy marked not done / skipped unless P5 ran). Anything cut listed.

## Phase timing

| Phase | Step | Time |
| --- | --- | --- |
| P1 | S1 follow + notify | 20 |
| P2 | S2 subscriptions | 10 |
| P3 | S2 moderation | 10 |
| P4 | S3 polish pass | 30 |
| P5 | S4 deploy (optional) | 20 |
| | **Total** | **~1.5h** (~1h10 without P5) |

If behind: cut in `plan.md` §7 order: deploy, then moderation (P3), then subscriptions (P2), then the Following
page (keep the follow button + toast). Never cut P4.
