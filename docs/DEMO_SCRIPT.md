# Dream11 Live: demo video script

About 3 minutes. Screen recording of https://dream11-live.vercel.app with my voice over it.

**Before recording:** open https://dream11-live.onrender.com/api/health once and wait for `{"ok":true…}` (the free
server sleeps when idle). Use two browser windows: window A logged in as `priya`, window B as `RohitReacts`
(or another creator), with a camera and a match video file ready.

---

## 1. The problem (0:00–0:25)

**Show:** the home page, logged in.

**Say:** "In India, cricket is something we watch together: we argue, celebrate sixes and groan at wickets with
friends. But most fans now watch alone on a phone. TV is one-way, and YouTube watch-alongs are 10 to 30 seconds
behind, with the score and friends in other apps. Dream11 Live brings the shared match experience back, by letting
fans watch a match through their favourite creator, with everything in one place."

## 2. Discovery: the match hub (0:25–0:45)

**Show:** the live IND vs AUS card, then click it to open the match page with all the creators streaming it.

**Say:** "Everything starts from the match. Here IND vs AUS is live, with the score updating ball by ball, and every
creator streaming it is listed with their language and the team they support. I pick the one I like, Hindi
watch-along, memes or tactics."

## 3. Watching a stream (0:45–1:35)

**Show:** open a stream. Drag the creator's camera around, switch to Side by side and back, move the Match and
Creator volume sliders.

**Say:** "The match and the creator come in as two separate live video streams over WebRTC, so latency is under a
second. Because they're separate, I choose the layout: picture-in-picture that I can drag, or side by side. And I
control the audio mix: turn the match commentary down and the creator up, or the other way round. A normal stream
can't do this."

**Show:** the scorecard strip under the player as a ball comes in.

**Say:** "Under the player is a ball-by-ball scorecard: score, batters, bowler and the last six balls, pushed live
to every stream on this match, so no notification spoils a six before I see it."

## 4. The crowd (1:35–2:15)

**Show:** pick the IND team badge, send a chat message, tap 🔥 a few times and watch the hype meter, vote in the
poll on the video.

**Say:** "Chat is real time, with team badges, so you know who's supporting whom, and SUB badges for subscribers.
Emoji reactions float over the video and drive a hype meter that spikes on sixes and wickets. The creator runs
polls, and results update live on the video for everyone."

## 5. The creator side (2:15–2:45)

**Show:** window B: the creator dashboard. Pick the video file, allow the camera, Go live. In window A, show the
go-live toast (follow the creator first), and open the stream. Back in B, start a poll and delete a chat message.

**Say:** "Any creator can go live from the browser, no OBS needed: a match video plus their camera. Followers get
a notification instantly. From the dashboard the creator runs polls, sees the hype, and moderates chat. Fans can
also follow creators and subscribe to one of three tiers."

## 6. Close (2:45–3:00)

**Show:** back to the home page with all the live streams.

**Say:** "It's built with React, Node.js, Socket.IO and LiveKit, deployed on Vercel and Render. Next, I'd add
ball-by-ball predictions with leaderboards, bringing Dream11's fantasy strength into the live moment, and automatic
clips of every wicket and six. Thank you."
