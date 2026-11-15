# Dream11 Live: short note

Live demo: [dream11-live.vercel.app](https://dream11-live.vercel.app)

**Fan problem.** Indian cricket fans rarely watch alone in spirit: they argue, celebrate and groan with friends.
But broadcast TV is one-way, and YouTube watch-alongs scatter chat, scores and reactions across tabs. Fans who
can't watch with friends lose the shared moment that makes a match fun.

**Hypothesis.** Fans will watch more, and come back more often, when they can watch a match through a favourite
creator who speaks their language and supports their team, with live score and crowd reactions in one place.

**Solution and design.** Each match is a hub listing every creator streaming it. A stream shows the match plus
the creator's facecam (PiP or side by side) with separate volume sliders. A ball-by-ball scorecard sits under the
player. Chat carries team badges, and emoji reactions feed a hype meter that spikes on sixes and wickets. Polls,
follows and subscriptions make it a social space. I chose WebRTC (LiveKit) for sub-second latency, because a
reaction that arrives after the six feels dead.

**AI tools.** I used Claude Code (Anthropic) as a pair programmer: for planning the architecture, writing and
reviewing code, headless browser testing, and drafting documentation. I made the product and design decisions.
